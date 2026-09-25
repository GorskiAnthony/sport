package com.tournoicenter.security;

import com.tournoicenter.config.CookieProperties;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/** Builds the httpOnly cookie that carries the JWT for browser clients (web frontend and mobile
 *  web build) — see AuthController and TournamentController.joinAsReferee. Native mobile
 *  (Capacitor) never reads this cookie; it keeps using the Bearer token returned in the JSON
 *  body, unaffected by any of this.
 *
 *  Host-only (no Domain attribute) and SameSite=Strict work here because every browser client
 *  only ever calls its own origin's nginx, which reverse-proxies /api/* to the backend on the
 *  same domain the page was loaded from — see deploy.md. Path=/api keeps it off static asset
 *  requests. */
@Component
public class AuthCookieService {

    public static final String COOKIE_NAME = "auth_token";

    private final CookieProperties cookieProperties;

    public AuthCookieService(CookieProperties cookieProperties) {
        this.cookieProperties = cookieProperties;
    }

    public ResponseCookie build(String token, Duration maxAge) {
        return ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .sameSite("Strict")
                .path("/api")
                .maxAge(maxAge)
                .build();
    }

    public ResponseCookie clear() {
        return ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .sameSite("Strict")
                .path("/api")
                .maxAge(0)
                .build();
    }
}
