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
                    .setSuccessUrl(clientUrl + "/checkout/success?plan=" + plan.toLowerCase(Locale.ROOT))
                    .setCancelUrl(clientUrl + "/checkout/cancel")
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

    @Transactional
    public String changePlan(Long userId, String plan, String period) {
        String priceId = priceIdFor(plan, period);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Aucun abonnement actif à modifier."));

        try {
            var stripeSubscription = stripeClient.subscriptions().retrieve(subscription.getStripeSubscriptionId());
            String itemId = stripeSubscription.getItems().getData().get(0).getId();

            var params = com.stripe.param.SubscriptionUpdateParams.builder()
                    .addItem(com.stripe.param.SubscriptionUpdateParams.Item.builder()
                            .setId(itemId)
                            .setPrice(priceId)
                            .build())
                    .setProrationBehavior(com.stripe.param.SubscriptionUpdateParams.ProrationBehavior.CREATE_PRORATIONS)
                    // Sans ceci, le comportement par défaut de Stripe laisse passer la mise à jour
                    // même si le paiement immédiat de la proration échoue (carte refusée, 3DS requis...),
                    // avec l'abonnement en status "past_due"/"incomplete" — et le code plus bas accordait
                    // quand même le nouveau plan, sans jamais revenir en arrière tant que l'abonnement
                    // n'était pas totalement annulé. error_if_incomplete fait échouer l'appel Stripe
                    // (StripeException) dans ce cas, avant qu'on ne touche à user.plan.
                    .setPaymentBehavior(com.stripe.param.SubscriptionUpdateParams.PaymentBehavior.ERROR_IF_INCOMPLETE)
                    .build();

            var updated = stripeClient.subscriptions().update(subscription.getStripeSubscriptionId(), params);

            String newPlan = plan.toUpperCase(Locale.ROOT);
            user.setPlan(Plan.valueOf(newPlan));
            subscription.setStripePriceId(priceId);
            subscription.setStatus(updated.getStatus());
            subscription.setCurrentPeriodEnd(currentPeriodEndOf(updated));

            return newPlan;
        } catch (StripeException e) {
            log.error("Échec du changement de plan Stripe pour l'utilisateur {}", userId, e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Erreur Stripe lors du changement de plan.");
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

        // getObject() ne désérialise que si l'apiVersion de l'événement correspond exactement à
        // celle figée dans le SDK stripe-java (Stripe.API_VERSION) : dès que le compte Stripe
        // avance vers une version d'API plus récente que celle du SDK, getObject() renvoie
        // silencieusement Optional.empty() (pas d'exception) et cette méthode ne faisait plus rien
        // — le webhook répondait quand même 200 à Stripe, laissant croire que tout allait bien
        // pendant que User.plan restait figé en base. deserializeUnsafe() reparse le JSON brut de
        // l'événement sans cette vérification de version.
        var deserializer = event.getDataObjectDeserializer();
        StripeObject dataObject;
        try {
            dataObject = deserializer.getObject().orElse(null);
            if (dataObject == null) {
                log.warn("Désérialisation Stripe stricte en échec pour l'événement {} (type {}, apiVersion {}) "
                                + "— probable écart de version entre le SDK et le compte Stripe ; fallback sur deserializeUnsafe().",
                        event.getId(), event.getType(), event.getApiVersion());
                dataObject = deserializer.deserializeUnsafe();
            }
        } catch (com.stripe.exception.EventDataObjectDeserializationException e) {
            log.error("Impossible de désérialiser l'événement Stripe {} (type {})", event.getId(), event.getType(), e);
            return;
        }

        switch (event.getType()) {
            case "checkout.session.completed" -> onCheckoutCompleted((Session) dataObject);
            case "customer.subscription.updated" -> onSubscriptionUpdated((com.stripe.model.Subscription) dataObject);
            case "customer.subscription.deleted" -> onSubscriptionDeleted((com.stripe.model.Subscription) dataObject);
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
