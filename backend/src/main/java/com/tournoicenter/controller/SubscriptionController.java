package com.tournoicenter.controller;

import com.tournoicenter.dto.subscription.CheckoutRequest;
import com.tournoicenter.dto.subscription.CheckoutUrlResponse;
import com.tournoicenter.dto.subscription.PlanChangeResponse;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.service.SubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/checkout")
    public CheckoutUrlResponse checkout(@AuthenticationPrincipal JwtPrincipal principal, @Valid @RequestBody CheckoutRequest request) {
        return new CheckoutUrlResponse(subscriptionService.createCheckoutSession(principal.userId(), request.plan(), request.period()));
    }

    @PostMapping("/change-plan")
    public PlanChangeResponse changePlan(@AuthenticationPrincipal JwtPrincipal principal, @Valid @RequestBody CheckoutRequest request) {
        return new PlanChangeResponse(subscriptionService.changePlan(principal.userId(), request.plan(), request.period()));
    }

    @PostMapping("/portal")
    public CheckoutUrlResponse portal(@AuthenticationPrincipal JwtPrincipal principal) {
        return new CheckoutUrlResponse(subscriptionService.createPortalSession(principal.userId()));
    }

    @PostMapping("/webhook")
    public Map<String, Boolean> webhook(HttpServletRequest request,
                                         @RequestHeader("Stripe-Signature") String signature) throws IOException {
        String payload = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        subscriptionService.handleWebhook(payload, signature);
        return Map.of("received", true);
    }
}
