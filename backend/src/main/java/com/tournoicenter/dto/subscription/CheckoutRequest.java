package com.tournoicenter.dto.subscription;

import jakarta.validation.constraints.NotBlank;

public record CheckoutRequest(@NotBlank String plan) {
}
