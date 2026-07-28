package com.tournoicenter.controller;

import com.tournoicenter.dto.eventpass.EventPassCreditsResponse;
import com.tournoicenter.dto.subscription.CheckoutUrlResponse;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.service.EventPassService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/event-pass")
public class EventPassController {

    private final EventPassService eventPassService;

    public EventPassController(EventPassService eventPassService) {
        this.eventPassService = eventPassService;
    }

    @PostMapping("/checkout")
    public CheckoutUrlResponse checkout(@AuthenticationPrincipal JwtPrincipal principal) {
        return new CheckoutUrlResponse(eventPassService.createCheckoutSession(principal.userId()));
    }

    @GetMapping("/credits")
    public EventPassCreditsResponse credits(@AuthenticationPrincipal JwtPrincipal principal) {
        return new EventPassCreditsResponse(eventPassService.hasAvailableCredit(principal.userId()));
    }
}
