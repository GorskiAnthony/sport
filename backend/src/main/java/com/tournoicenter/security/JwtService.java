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
    private static final String REFEREE_SESSION_TYPE = "referee_session";
    private static final Duration REFEREE_SESSION_TTL = Duration.ofDays(30);

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

    /** No backing users row — minted for whoever scans a tournament's referee QR code (see
     *  TournamentService.joinAsReferee). Deliberately not signed with the same claim shape as
     *  generateToken()/parseToken() (no "sub", a distinct "typ") so the two token families can
     *  never be confused with each other even if one gains fields later. */
    public String generateRefereeSessionToken(Long tournamentId, String refereeName, String joinToken) {
        Instant now = Instant.now();
        var builder = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .claim("typ", REFEREE_SESSION_TYPE)
                // Stocké en String : les claims numériques JJWT se relisent parfois en Integer
                // plutôt que Long selon le parseur JSON, ce qui ferait planter un
                // claims.get("tournamentId", Long.class) sur un ClassCastException.
                .claim("tournamentId", String.valueOf(tournamentId))
                .claim("joinToken", joinToken)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(REFEREE_SESSION_TTL)))
                .signWith(key);
        if (refereeName != null && !refereeName.isBlank()) {
            builder.claim("refereeName", refereeName);
        }
        return builder.compact();
    }

    public Optional<RefereeSessionPrincipal> parseRefereeSessionToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            if (!REFEREE_SESSION_TYPE.equals(claims.get("typ", String.class))) {
                return Optional.empty();
            }
            Long tournamentId = Long.valueOf(claims.get("tournamentId", String.class));
            String refereeName = claims.get("refereeName", String.class);
            String joinToken = claims.get("joinToken", String.class);
            return Optional.of(new RefereeSessionPrincipal(tournamentId, refereeName, joinToken));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
