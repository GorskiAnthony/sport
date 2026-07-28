package com.tournoicenter.service;

import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.tournoicenter.config.CorsProperties;
import com.tournoicenter.config.StripeProperties;
import com.tournoicenter.domain.EventPassPurchase;
import com.tournoicenter.domain.EventPassStatus;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.User;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.EventPassPurchaseRepository;
import com.tournoicenter.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;

@Service
public class EventPassService {

    private static final Logger log = LoggerFactory.getLogger(EventPassService.class);

    private final UserRepository userRepository;
    private final EventPassPurchaseRepository eventPassPurchaseRepository;
    private final StripeClient stripeClient;
    private final StripeProperties stripeProperties;
    private final CorsProperties corsProperties;

    public EventPassService(UserRepository userRepository, EventPassPurchaseRepository eventPassPurchaseRepository,
                             StripeClient stripeClient, StripeProperties stripeProperties, CorsProperties corsProperties) {
        this.userRepository = userRepository;
        this.eventPassPurchaseRepository = eventPassPurchaseRepository;
        this.stripeClient = stripeClient;
        this.stripeProperties = stripeProperties;
        this.corsProperties = corsProperties;
    }

    @Transactional
    public String createCheckoutSession(Long userId) {
        String priceId = stripeProperties.priceEventPass();
        if (priceId == null || priceId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Pass Événement indisponible.");
        }
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
                    .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.PAYMENT)
                    .addLineItem(com.stripe.param.checkout.SessionCreateParams.LineItem.builder()
                            .setPrice(priceId)
                            .setQuantity(1L)
                            .build())
                    .setSuccessUrl(clientUrl + "/dashboard/tournaments/new?eventPass=1")
                    .setCancelUrl(clientUrl + "/checkout/cancel")
                    .putMetadata("userId", String.valueOf(userId))
                    .putMetadata("type", "EVENT_PASS")
                    .build();

            Session session = stripeClient.checkout().sessions().create(params);
            return session.getUrl();
        } catch (StripeException e) {
            log.error("Échec de création de session Stripe (Pass Événement) pour l'utilisateur {}", userId, e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Erreur Stripe lors de la création de la session.");
        }
    }

    @Transactional
    public void onCheckoutCompleted(Session session) {
        if (eventPassPurchaseRepository.findByStripeCheckoutSessionId(session.getId()).isPresent()) {
            return;
        }

        Map<String, String> metadata = session.getMetadata();
        if (metadata == null) return;
        String userIdRaw = metadata.get("userId");
        if (userIdRaw == null) return;

        userRepository.findById(Long.valueOf(userIdRaw)).ifPresent(user ->
                eventPassPurchaseRepository.save(new EventPassPurchase(user, session.getId())));
    }

    @Transactional(readOnly = true)
    public boolean hasAvailableCredit(Long userId) {
        return eventPassPurchaseRepository.existsByUserIdAndStatus(userId, EventPassStatus.AVAILABLE);
    }

    @Transactional
    public Optional<EventPassPurchase> findAvailableCredit(Long userId) {
        return eventPassPurchaseRepository.findFirstByUserIdAndStatusOrderByCreatedAtAsc(userId, EventPassStatus.AVAILABLE);
    }

    @Transactional
    public void consumeCredit(EventPassPurchase credit, Tournament tournament) {
        credit.setStatus(EventPassStatus.USED);
        credit.setTournament(tournament);
        credit.setUsedAt(Instant.now());
        tournament.setEventPassExpiresAt(tournament.getEndDate().plusDays(7).atStartOfDay(ZoneOffset.UTC).toInstant());
    }
}
