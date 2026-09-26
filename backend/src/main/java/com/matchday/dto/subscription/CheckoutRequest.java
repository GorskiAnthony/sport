package com.matchday.dto.subscription;

import jakarta.validation.constraints.NotBlank;

public record CheckoutRequest(@NotBlank String plan, String period) {
}
