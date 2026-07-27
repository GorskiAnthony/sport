package com.tournoicenter.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;

/**
 * Per-account lockout on top of {@link RateLimitingFilter}'s per-IP limit — that one caps how many
 * auth requests a given IP can make, but a distributed attempt (many IPs, one target email) sailed
 * through it untouched. This tracks failed attempts per email regardless of source IP. Same
 * in-memory trade-off as the rest of this package's security services (see
 * {@link TokenRevocationService}): fine for a single instance, a restart clears it.
 */
@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final Cache<String, Integer> attempts = Caffeine.newBuilder()
            .expireAfterWrite(WINDOW)
            .maximumSize(50_000)
            .build();

    public boolean isLocked(String email) {
        Integer count = attempts.getIfPresent(key(email));
        return count != null && count >= MAX_ATTEMPTS;
    }

    public void recordFailure(String email) {
        attempts.asMap().merge(key(email), 1, Integer::sum);
    }

    public void recordSuccess(String email) {
        attempts.invalidate(key(email));
    }

    private String key(String email) {
        return email.toLowerCase(Locale.ROOT);
    }
}
