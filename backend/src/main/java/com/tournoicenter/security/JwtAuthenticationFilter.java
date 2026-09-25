package com.tournoicenter.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);
        if (token != null) {
            Optional<JwtPrincipal> principal = jwtService.parseToken(token);
            if (principal.isPresent()) {
                JwtPrincipal p = principal.get();
                List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + p.role().name()));
                var authentication = new UsernamePasswordAuthenticationToken(p, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                // Ne colle jamais avec un vrai rôle utilisateur (ORGANIZER/SPECTATOR/ADMIN) —
                // voir SecurityConfig, le catch-all final exclut délibérément cette autorité.
                jwtService.parseRefereeSessionToken(token).ifPresent(session -> {
                    var authorities = List.<GrantedAuthority>of(new SimpleGrantedAuthority("ROLE_TOURNAMENT_REFEREE_SESSION"));
                    var authentication = new UsernamePasswordAuthenticationToken(session, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                });
            }
        }
        filterChain.doFilter(request, response);
    }

    /** Header first — the native mobile Bearer flow, unchanged. Browsers (web frontend, mobile
     *  web build) no longer send this header at all (the token sits in an httpOnly cookie they
     *  can't read), so they fall through to the cookie set by AuthCookieService. */
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        return Arrays.stream(cookies)
                .filter(cookie -> AuthCookieService.COOKIE_NAME.equals(cookie.getName()))
                .findFirst()
                .map(Cookie::getValue)
                .orElse(null);
    }
}
