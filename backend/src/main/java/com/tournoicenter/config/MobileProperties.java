package com.tournoicenter.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Base URL of the mobile app's own web build — distinct from CorsProperties.allowedOrigin
 *  (the main web app's URL), used to build the referee QR join link
 *  ({url}/join/{token}, see TournamentService.getRefereeJoinInfo). */
@ConfigurationProperties(prefix = "app.mobile")
public record MobileProperties(String url) {
}
