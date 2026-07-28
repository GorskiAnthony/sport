package com.tournoicenter.dto.buvette;

import java.math.BigDecimal;
import java.util.List;

public record BuvetteSummaryResponse(BigDecimal totalRevenue, int saleCount, List<BuvetteProductSalesResponse> byProduct) {
}
