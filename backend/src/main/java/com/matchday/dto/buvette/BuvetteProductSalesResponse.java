package com.matchday.dto.buvette;

import java.math.BigDecimal;

public record BuvetteProductSalesResponse(String productName, int quantitySold, BigDecimal revenue) {
}
