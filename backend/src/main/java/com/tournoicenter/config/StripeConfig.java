package com.tournoicenter.config;

import com.stripe.StripeClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StripeConfig {

    @Bean
    public StripeClient stripeClient(StripeProperties properties) {
        return new StripeClient(properties.secretKey());
    }
}
