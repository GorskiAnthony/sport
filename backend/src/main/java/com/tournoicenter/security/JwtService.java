package com.tournoicenter.security;

import com.tournoicenter.config.JwtProperties;
import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final Duration expiration;
    private final TokenRevocationService tokenRevocationService;

    private static final int MIN_SECRET_BYTES = 32;

    public JwtService(JwtProperties properties, TokenRevocationService tokenRevocationService) {
        String secret = properties.secret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "The JWT_SECRET environment variable must be set to a random secret of at least "
                            + MIN_SECRET_BYTES + " bytes (e.g. `openssl rand -base64 32`).");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = Duration.ofDays(properties.expirationDays());
        this.tokenRevocationService = tokenRevocationService;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("plan", user.getPlan().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(key)
                .compact();
    }

    public Optional<JwtPrincipal> parseToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            String tokenId = claims.getId();
            if (tokenRevocationService.isRevoked(tokenId)) {
                return Optional.empty();
            }
            Long userId = Long.valueOf(claims.getSubject());
            String email = claims.get("email", String.class);
            Role role = Role.valueOf(claims.get("role", String.class));
            Plan plan = Plan.valueOf(claims.get("plan", String.class));
            return Optional.of(new JwtPrincipal(userId, email, role, plan, tokenId));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
