package com.tournoicenter.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
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
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
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
}
