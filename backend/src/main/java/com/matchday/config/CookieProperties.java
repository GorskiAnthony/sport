package com.matchday.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Controls the `Secure` attribute of the auth cookie (see AuthCookieService) — true in prod
 *  (HTTPS only), false in dev (plain HTTP on localhost, where a Secure cookie would never be
 *  sent back by the browser). */
@ConfigurationProperties(prefix = "app.cookie")
public record CookieProperties(boolean secure) {
}
