package com.tournoicenter.dto.buvette;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record BuvetteSaleResponse(Long id, Long tournamentId, List<BuvetteSaleItemSnapshot> items,
                                   BigDecimal total, Instant createdAt) {
}
