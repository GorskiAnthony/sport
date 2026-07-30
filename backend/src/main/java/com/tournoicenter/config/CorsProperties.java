package com.tournoicenter.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/** allowedOrigin stays the single canonical web app URL used to build absolute links (reset
 *  password emails, sitemap, share pages, Stripe redirects...) — do not add mobile/native
 *  origins to it. additionalOrigins is CORS/WebSocket-allowlist-only, for origins that have no
 *  business being used as a link base (capacitor://localhost, the Ionic dev server...). */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(String allowedOrigin, List<String> additionalOrigins) {

    public CorsProperties {
        additionalOrigins = additionalOrigins == null ? List.of() : additionalOrigins;
    }

    public List<String> corsAllowedOrigins() {
        List<String> origins = new ArrayList<>();
        origins.add(allowedOrigin);
        origins.addAll(additionalOrigins);
        return origins;
    }
}
