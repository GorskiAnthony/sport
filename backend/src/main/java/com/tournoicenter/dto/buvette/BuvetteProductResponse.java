package com.tournoicenter.dto.buvette;

import com.tournoicenter.domain.BuvetteProduct;

import java.math.BigDecimal;

public record BuvetteProductResponse(Long id, Long tournamentId, String name, BigDecimal price) {
    public static BuvetteProductResponse from(BuvetteProduct product) {
        return new BuvetteProductResponse(product.getId(), product.getTournament().getId(), product.getName(), product.getPrice());
    }
}
