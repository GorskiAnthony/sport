package com.tournoicenter.security;

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
import java.util.concurrent.ConcurrentHashMap;
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
    private final ConcurrentHashMap<String, Window> authWindows = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Window> globalWindows = new ConcurrentHashMap<>();

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

    private boolean exceeds(ConcurrentHashMap<String, Window> windows, String key, int limit) {
        Window window = windows.computeIfAbsent(key, k -> new Window(Instant.now()));
        if (Duration.between(window.start, Instant.now()).compareTo(WINDOW) > 0) {
            windows.put(key, new Window(Instant.now()));
            return false;
        }
        return window.count.incrementAndGet() > limit;
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
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
