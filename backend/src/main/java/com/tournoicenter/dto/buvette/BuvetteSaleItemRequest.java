package com.tournoicenter.dto.buvette;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BuvetteSaleItemRequest(@NotNull Long productId, @Min(1) int quantity) {
}
