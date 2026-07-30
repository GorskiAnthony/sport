package com.tournoicenter.config;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CorsPropertiesTest {

    @Test
    void corsAllowedOrigins_combinesAllowedOriginWithAdditionalOrigins() {
        CorsProperties properties = new CorsProperties(
                "https://tournoicenter.fr",
                List.of("capacitor://localhost", "http://localhost:8100"));

        assertThat(properties.corsAllowedOrigins())
                .containsExactly("https://tournoicenter.fr", "capacitor://localhost", "http://localhost:8100");
    }

    @Test
    void corsAllowedOrigins_toleratesNullAdditionalOrigins() {
        CorsProperties properties = new CorsProperties("https://tournoicenter.fr", null);

        assertThat(properties.corsAllowedOrigins()).containsExactly("https://tournoicenter.fr");
    }
}
