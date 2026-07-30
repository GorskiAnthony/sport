package com.tournoicenter.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory fixed-window rate limiter, mirroring the express-rate-limit rules
 * from the Node reference API (20 req/15min on /api/auth/**, 200 req/15min on /api/**).
 * Not distributed-safe — fine for a single-instance deployment; swap for a shared store if scaled out.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int AUTH_LIMIT = 30;
    private static final int GLOBAL_LIMIT = 500;

    private final ObjectMapper objectMapper;
    /** Bounded + self-expiring (unlike a plain ConcurrentHashMap) so an IP seen once doesn't sit
     *  in memory forever — mirrors the Caffeine pattern already used by LoginAttemptService. */
    private final Cache<String, Window> authWindows = Caffeine.newBuilder()
            .expireAfterWrite(WINDOW)
            .maximumSize(50_000)
            .build();
    private final Cache<String, Window> globalWindows = Caffeine.newBuilder()
            .expireAfterWrite(WINDOW)
            .maximumSize(50_000)
            .build();

    public RateLimitingFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientKey = clientKey(request);

        if (path.startsWith("/api/auth/") && exceeds(authWindows, clientKey, AUTH_LIMIT)) {
            reject(response, "Trop de tentatives, réessayez dans 15 minutes.");
            return;
        }

        if (exceeds(globalWindows, clientKey, GLOBAL_LIMIT)) {
            reject(response, "Trop de requêtes, réessayez plus tard.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean exceeds(Cache<String, Window> windows, String key, int limit) {
        Window window = windows.get(key, k -> new Window(Instant.now()));
        if (Duration.between(window.start, Instant.now()).compareTo(WINDOW) > 0) {
            windows.put(key, new Window(Instant.now()));
            return false;
        }
        return window.count.incrementAndGet() > limit;
    }

    /** nginx appends via $proxy_add_x_forwarded_for rather than replacing, so the *last* entry is
     *  the one the trusted reverse proxy itself observed — the leftmost entry is whatever the client
     *  sent, and trusting it (as this used to) let a client bypass the whole limiter just by sending
     *  a different fake X-Forwarded-For per request. This assumes exactly one trusted proxy hop in
     *  front of the app; a differently-configured additional hop further out that blindly forwards
     *  client-supplied headers would need real trusted-proxy handling (e.g. Spring's
     *  forward-headers-strategy with an internal-proxies allowlist) to fully close. */
    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null) {
            return request.getRemoteAddr();
        }
        String[] parts = forwarded.split(",");
        return parts[parts.length - 1].trim();
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(Map.of("message", message)));
    }

    private static final class Window {
        final Instant start;
        final AtomicInteger count = new AtomicInteger(0);

        Window(Instant start) {
            this.start = start;
        }
    }
}
