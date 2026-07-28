package com.tournoicenter.dto.buvette;

import java.math.BigDecimal;

/** A receipt line, frozen at sale time — see BuvetteSale for why this isn't a foreign key. */
public record BuvetteSaleItemSnapshot(String productName, BigDecimal unitPrice, int quantity) {
}
