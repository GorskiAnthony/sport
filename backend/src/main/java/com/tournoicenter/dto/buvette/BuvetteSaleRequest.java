package com.tournoicenter.dto.buvette;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BuvetteSaleRequest(@NotEmpty @Valid List<BuvetteSaleItemRequest> items) {
}
