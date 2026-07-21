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
        configuration.setAllowedOrigins(List.of(corsProperties.allowedOrigin()));
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
                        // Actuator runs on a separate internal port (management.server.port) that's
                        // never published outside the Docker network — that's the real security
                        // boundary, not app-level JWT auth (which would be inconvenient for uptime
                        // checks/ops tooling to use anyway).
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/api/ws/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/share/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/logout").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/subscriptions/webhook").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tournaments/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tournaments/recent").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tournaments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/teams/followed").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/teams/followed/enriched").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/teams/*/follow").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/teams/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/matches/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
