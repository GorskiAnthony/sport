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
import com.tournoicenter.domain.User;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class SubscriptionService {

    private final UserRepository userRepository;
    private final StripeClient stripeClient;
    private final StripeProperties stripeProperties;
    private final CorsProperties corsProperties;

    public SubscriptionService(UserRepository userRepository, StripeClient stripeClient,
                                StripeProperties stripeProperties, CorsProperties corsProperties) {
        this.userRepository = userRepository;
        this.stripeClient = stripeClient;
        this.stripeProperties = stripeProperties;
        this.corsProperties = corsProperties;
    }

    @Transactional
    public String createCheckoutSession(Long userId, String plan) {
        String priceId = priceIdFor(plan);
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
                    .build();

            Session session = stripeClient.checkout().sessions().create(params);
            return session.getUrl();
        } catch (StripeException e) {
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
            case "customer.subscription.deleted" -> onSubscriptionDeleted((com.stripe.model.Subscription) dataObject.get());
            default -> {
                // événement non géré, ignoré volontairement
            }
        }
    }

    private void onCheckoutCompleted(Session session) {
        Map<String, String> metadata = session.getMetadata();
        if (metadata == null) return;

        String userIdRaw = metadata.get("userId");
        String planRaw = metadata.get("plan");
        if (userIdRaw == null || planRaw == null) return;

        userRepository.findById(Long.valueOf(userIdRaw)).ifPresent(user -> user.setPlan(Plan.valueOf(planRaw)));
    }

    private void onSubscriptionDeleted(com.stripe.model.Subscription subscription) {
        userRepository.findByStripeId(subscription.getCustomer()).ifPresent(user -> user.setPlan(Plan.FREE));
    }

    private String priceIdFor(String plan) {
        String priceId = switch (plan.toLowerCase(Locale.ROOT)) {
            case "classic" -> stripeProperties.priceClassic();
            case "pro" -> stripeProperties.pricePro();
            default -> null;
        };
        if (priceId == null || priceId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Plan invalide.");
        }
        return priceId;
    }
}
