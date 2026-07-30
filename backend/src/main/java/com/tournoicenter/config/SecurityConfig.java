package com.tournoicenter.config;

import com.tournoicenter.security.JsonAuthErrorHandler;
import com.tournoicenter.security.JwtAuthenticationFilter;
import com.tournoicenter.security.JwtService;
import com.tournoicenter.security.RateLimitingFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(CorsProperties corsProperties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(corsProperties.corsAllowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                     JwtService jwtService,
                                                     JsonAuthErrorHandler jsonAuthErrorHandler,
                                                     RateLimitingFilter rateLimitingFilter,
                                                     CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(jsonAuthErrorHandler)
                        .accessDeniedHandler(jsonAuthErrorHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/health").permitAll()
                        // permitAll() here isn't the security boundary: Actuator listens on a
                        // separate port (management.server.port, default 8081) served by a
                        // different embedded connector than the one this filter chain guards, so
                        // app-level JWT auth can't cover it anyway. Whether that port is reachable
                        // from outside the container is an infra/Dokploy config concern, not
                        // something enforced by this class — see "Monitoring" in deploy.md for the
                        // actual exposure model and the Basic Auth requirement if it's ever given a
                        // public Dokploy domain.
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/api/ws/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/share/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/sitemap.xml").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/logout").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/subscriptions/webhook").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/tournaments/*/sponsor-click").permitAll()
                        // Le token du QR code arbitre est lui-même le justificatif — voir
                        // TournamentService.joinAsReferee.
                        .requestMatchers(HttpMethod.POST, "/api/tournaments/join").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tournaments/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tournaments/recent").authenticated()
                        // Financial data — must stay ahead of the /api/tournaments/** permitAll below,
                        // which would otherwise expose every organizer's buvette sales/revenue publicly.
                        .requestMatchers(HttpMethod.GET, "/api/tournaments/*/buvette/**").authenticated()
                        // Le token renvoyé est un secret (voir Tournament.refereeJoinToken) —
                        // même raison, doit précéder le permitAll ci-dessous.
                        .requestMatchers(HttpMethod.GET, "/api/tournaments/*/referee-token").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tournaments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/teams/followed").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/teams/followed/enriched").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/teams/*/follow").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/teams/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/matches/**").permitAll()
                        // Seules ces trois actions sont ouvertes à une session de tournoi (QR
                        // code arbitre, voir MatchActor.TournamentSessionActor) — tout le reste
                        // de l'API leur est fermé par le catch-all ci-dessous, qui liste
                        // explicitement les rôles utilisateur réels et exclut donc
                        // ROLE_TOURNAMENT_REFEREE_SESSION par construction.
                        .requestMatchers(HttpMethod.PATCH, "/api/matches/*/start", "/api/matches/*/score", "/api/matches/*/goal")
                        .hasAnyRole("ORGANIZER", "ADMIN", "TOURNAMENT_REFEREE_SESSION")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().hasAnyRole("ORGANIZER", "SPECTATOR", "ADMIN"))
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
