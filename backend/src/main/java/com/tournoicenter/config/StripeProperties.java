package com.tournoicenter.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.stripe")
public record StripeProperties(String secretKey, String webhookSecret, String priceClassic, String pricePro,
                                String priceClassicAnnual, String priceProAnnual, String priceEventPass) {
}
