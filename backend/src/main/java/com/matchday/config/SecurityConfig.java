package com.matchday.config;

import com.matchday.security.AuthCookieService;
import com.matchday.security.CsrfCookieFilter;
import com.matchday.security.JsonAuthErrorHandler;
import com.matchday.security.JwtAuthenticationFilter;
import com.matchday.security.JwtService;
import com.matchday.security.RateLimitingFilter;
import jakarta.servlet.http.Cookie;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.SessionManagementConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

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
        // Retiré avant même de commencer la chaîne fluide ci-dessous (removeConfigurer() ne
        // renvoie pas HttpSecurity, donc ne peut pas s'y insérer) : voir le commentaire détaillé
        // sur .securityContext(...) plus bas pour la raison.
        http.removeConfigurer(SessionManagementConfigurer.class);
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                // Le Bearer token (natif) est par nature immunisé au CSRF — seules les requêtes
                // authentifiées par le cookie httpOnly (voir AuthCookieService) en ont besoin.
                // requireCsrfProtectionMatcher restreint donc la vérification aux requêtes
                // mutantes SANS header Authorization ; ignoringRequestMatchers couvre en plus
                // les endpoints permitAll() qui n'ont encore aucune session au moment de
                // l'appel (register/login typiquement — pas de cookie XSRF-TOKEN à renvoyer
                // avant la toute première réponse du backend) et les webhooks/QR tokens dont le
                // secret transmis joue déjà ce rôle.
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                        .requireCsrfProtectionMatcher(csrfProtectionMatcher())
                        .ignoringRequestMatchers(
                                "/api/auth/register", "/api/auth/login",
                                "/api/auth/forgot-password", "/api/auth/reset-password",
                                "/api/subscriptions/webhook",
                                "/api/tournaments/*/sponsor-click", "/api/tournaments/join",
                                "/api/teams/*/check-in"))
                .addFilterAfter(new CsrfCookieFilter(), UsernamePasswordAuthenticationFilter.class)
                // Repository explicite (jamais de HttpSession, comme SessionCreationPolicy.STATELESS
                // aurait fait), + retrait pur et simple de SessionManagementConfigurer : sans ça,
                // SessionManagementFilter voit une Authentication fraîchement posée dans le
                // SecurityContextHolder par JwtAuthenticationFilter, jamais "vue" via une session
                // (il n'y en a pas), et traite donc CHAQUE requête authentifiée comme une toute
                // nouvelle authentification — déclenchant sa stratégie par défaut, qui inclut
                // CsrfAuthenticationStrategy. Celle-ci efface puis régénère le cookie XSRF-TOKEN à
                // chaque appel (constaté en local : le cookie que le client vient de lire est déjà
                // invalide au prochain appel). Ni repasser sessionAuthenticationStrategy sur le DSL
                // ni pré-poser un SessionAuthenticationStrategy partagé n'empêche CsrfConfigurer de
                // l'y ajouter quand même — seul le retrait complet du configurer fonctionne. Sans
                // intérêt de toute façon ici : pas de session à protéger contre la fixation.
                .securityContext(context -> context.securityContextRepository(new RequestAttributeSecurityContextRepository()))
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
                        // Pas de compte équipe : le check-in doit être joignable par n'importe quel
                        // représentant d'équipe scannant le QR du tournoi, sans authentification.
                        .requestMatchers(HttpMethod.PATCH, "/api/teams/*/check-in").permitAll()
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

    private static final Set<String> CSRF_SAFE_METHODS = Set.of("GET", "HEAD", "TRACE", "OPTIONS");

    /** A request carrying an Authorization header authenticates via Bearer (native mobile),
     *  which CSRF can't touch by construction — only cookie-authenticated browser requests need
     *  the check. Combined with ignoringRequestMatchers above for the handful of endpoints that
     *  have no session yet.
     *
     *  Requiring the CSRF token merely because Authorization is absent (regardless of whether the
     *  auth_token cookie is even present) broke TournamentFlowTest/TournamentViewFlowTest: a truly
     *  anonymous mutating request — no header, no cookie, nothing to forge — got rejected 403 by
     *  CSRF before authorization ever ran, instead of the 401 those tests (rightly) expect for
     *  "not authenticated". Scoping the check to requests that actually carry the auth_token
     *  cookie fixes that and is also the more precise rule: CSRF only matters once there's an
     *  ambient cookie session an attacker's cross-site request could ride along on. */
    private RequestMatcher csrfProtectionMatcher() {
        return request -> {
            if (CSRF_SAFE_METHODS.contains(request.getMethod()) || request.getHeader("Authorization") != null) {
                return false;
            }
            Cookie[] cookies = request.getCookies();
            return cookies != null
                    && Arrays.stream(cookies).anyMatch(cookie -> AuthCookieService.COOKIE_NAME.equals(cookie.getName()));
        };
    }
}
