package com.tournoicenter.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.tournoicenter.config.JwtProperties;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * In-memory blocklist of logged-out token ids (jti), so a logout actually invalidates that token
 * instead of leaving it usable until natural expiry. Not distributed-safe — same trade-off as
 * {@link RateLimitingFilter} (see its javadoc): fine for a single instance, and a restart simply
 * forgets revocations (equivalent to those tokens becoming valid again until they'd have expired
 * anyway). Entries expire on their own after a token's max lifetime, since a jti stops mattering
 * once the token it belonged to would have expired regardless.
 */
@Service
public class TokenRevocationService {

    private final Cache<String, Boolean> revoked;

    public TokenRevocationService(JwtProperties jwtProperties) {
        this.revoked = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofDays(jwtProperties.expirationDays()))
                .maximumSize(100_000)
                .build();
    }

    public void revoke(String tokenId) {
        if (tokenId != null) {
            revoked.put(tokenId, Boolean.TRUE);
        }
    }

    public boolean isRevoked(String tokenId) {
        return tokenId != null && revoked.getIfPresent(tokenId) != null;
    }
}
