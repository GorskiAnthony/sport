package com.tournoicenter.service;

import com.stripe.StripeClient;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.tournoicenter.config.CorsProperties;
import com.tournoicenter.config.StripeProperties;
import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Subscription;
import com.tournoicenter.domain.User;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.SubscriptionRepository;
import com.tournoicenter.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final StripeClient stripeClient;
    private final StripeProperties stripeProperties;
    private final CorsProperties corsProperties;
    private final EventPassService eventPassService;

    public SubscriptionService(UserRepository userRepository, SubscriptionRepository subscriptionRepository,
                                StripeClient stripeClient, StripeProperties stripeProperties,
                                CorsProperties corsProperties, EventPassService eventPassService) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.stripeClient = stripeClient;
        this.stripeProperties = stripeProperties;
        this.corsProperties = corsProperties;
        this.eventPassService = eventPassService;
    }

    @Transactional
    public String createCheckoutSession(Long userId, String plan, String period) {
        String priceId = priceIdFor(plan, period);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        try {
            String stripeCustomerId = user.getStripeId();
            if (stripeCustomerId == null) {
                var customer = stripeClient.customers().create(
                        com.stripe.param.CustomerCreateParams.builder().setEmail(user.getEmail()).build());
                stripeCustomerId = customer.getId();
                user.setStripeId(stripeCustomerId);
            }

            String clientUrl = corsProperties.allowedOrigin();
            var params = com.stripe.param.checkout.SessionCreateParams.builder()
                    .setCustomer(stripeCustomerId)
                    .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.SUBSCRIPTION)
                    .addLineItem(com.stripe.param.checkout.SessionCreateParams.LineItem.builder()
                            .setPrice(priceId)
                            .setQuantity(1L)
                            .build())
                    .setSuccessUrl(clientUrl + "/dashboard?upgraded=1")
                    .setCancelUrl(clientUrl + "/pricing")
                    .putMetadata("userId", String.valueOf(userId))
                    .putMetadata("plan", plan.toUpperCase(Locale.ROOT))
                    .putMetadata("priceId", priceId)
                    .build();

            Session session = stripeClient.checkout().sessions().create(params);
            return session.getUrl();
        } catch (StripeException e) {
            log.error("Échec de création de session Stripe (checkout abonnement) pour l'utilisateur {}", userId, e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Erreur Stripe lors de la création de la session.");
        }
    }

    @Transactional(readOnly = true)
    public String createPortalSession(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        if (user.getStripeId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Aucun abonnement actif.");
        }

        try {
            var params = com.stripe.param.billingportal.SessionCreateParams.builder()
                    .setCustomer(user.getStripeId())
                    .setReturnUrl(corsProperties.allowedOrigin() + "/dashboard/settings")
                    .build();
            return stripeClient.billingPortal().sessions().create(params).getUrl();
        } catch (StripeException e) {
            log.error("Échec d'ouverture du portail Stripe pour l'utilisateur {}", userId, e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Erreur Stripe lors de l'ouverture du portail.");
        }
    }

    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        Event event;
        try {
            event = stripeClient.constructEvent(payload, signatureHeader, stripeProperties.webhookSecret());
        } catch (SignatureVerificationException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Webhook signature invalide.");
        }

        Optional<StripeObject> dataObject = event.getDataObjectDeserializer().getObject();
        if (dataObject.isEmpty()) {
            return;
        }

        switch (event.getType()) {
            case "checkout.session.completed" -> onCheckoutCompleted((Session) dataObject.get());
            case "customer.subscription.updated" -> onSubscriptionUpdated((com.stripe.model.Subscription) dataObject.get());
            case "customer.subscription.deleted" -> onSubscriptionDeleted((com.stripe.model.Subscription) dataObject.get());
            default -> {
                // événement non géré, ignoré volontairement
            }
        }
    }

    private void onCheckoutCompleted(Session session) {
        Map<String, String> metadata = session.getMetadata();
        if (metadata == null) return;

        if ("EVENT_PASS".equals(metadata.get("type"))) {
            eventPassService.onCheckoutCompleted(session);
            return;
        }

        String userIdRaw = metadata.get("userId");
        String planRaw = metadata.get("plan");
        String priceId = metadata.get("priceId");
        if (userIdRaw == null || planRaw == null) return;

        userRepository.findById(Long.valueOf(userIdRaw)).ifPresent(user -> {
            user.setPlan(Plan.valueOf(planRaw));
            upsertSubscription(user, session.getSubscription(), priceId);
        });
    }

    private void upsertSubscription(User user, String stripeSubscriptionId, String priceId) {
        if (stripeSubscriptionId == null) return;

        try {
            var stripeSubscription = stripeClient.subscriptions().retrieve(stripeSubscriptionId);
            String status = stripeSubscription.getStatus();
            Instant currentPeriodEnd = currentPeriodEndOf(stripeSubscription);

            Subscription subscription = subscriptionRepository.findByUserId(user.getId()).orElse(null);
            if (subscription == null) {
                subscriptionRepository.save(new Subscription(user, stripeSubscriptionId, priceId, status, currentPeriodEnd));
            } else {
                subscription.setStripeSubscriptionId(stripeSubscriptionId);
                subscription.setStripePriceId(priceId);
                subscription.setStatus(status);
                subscription.setCurrentPeriodEnd(currentPeriodEnd);
            }
        } catch (StripeException e) {
            // Le plan de l'utilisateur est déjà à jour ; l'historique local de l'abonnement
            // sera resynchronisé au prochain événement webhook si celui-ci échoue.
            log.warn("Échec de synchronisation de l'abonnement Stripe {} pour l'utilisateur {}", stripeSubscriptionId, user.getId(), e);
        }
    }

    private void onSubscriptionUpdated(com.stripe.model.Subscription subscription) {
        subscriptionRepository.findByStripeSubscriptionId(subscription.getId()).ifPresent(local -> {
            local.setStatus(subscription.getStatus());
            local.setCurrentPeriodEnd(currentPeriodEndOf(subscription));
        });
    }

    /** Depuis l'API Stripe 2025+, current_period_end vit sur chaque SubscriptionItem
     *  (facturation par ligne) plutôt que sur la Subscription elle-même. */
    private Instant currentPeriodEndOf(com.stripe.model.Subscription subscription) {
        return subscription.getItems().getData().stream()
                .findFirst()
                .map(item -> Instant.ofEpochSecond(item.getCurrentPeriodEnd()))
                .orElse(Instant.now());
    }

    private void onSubscriptionDeleted(com.stripe.model.Subscription subscription) {
        userRepository.findByStripeId(subscription.getCustomer()).ifPresent(user -> user.setPlan(Plan.FREE));
        subscriptionRepository.findByStripeSubscriptionId(subscription.getId())
                .ifPresent(local -> local.setStatus("canceled"));
    }

    private String priceIdFor(String plan, String period) {
        boolean annual = "annual".equalsIgnoreCase(period);
        String priceId = switch (plan.toLowerCase(Locale.ROOT)) {
            case "classic" -> annual ? stripeProperties.priceClassicAnnual() : stripeProperties.priceClassic();
            case "pro" -> annual ? stripeProperties.priceProAnnual() : stripeProperties.pricePro();
            default -> null;
        };
        if (priceId == null || priceId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Plan invalide.");
        }
        return priceId;
    }
}
