package com.matchday.controller;

import com.matchday.dto.auth.AuthResponse;
import com.matchday.dto.auth.ForgotPasswordRequest;
import com.matchday.dto.auth.LoginRequest;
import com.matchday.dto.auth.RegisterRequest;
import com.matchday.dto.auth.ResetPasswordRequest;
import com.matchday.dto.auth.UpdateProfileRequest;
import com.matchday.dto.auth.UserResponse;
import com.matchday.config.JwtProperties;
import com.matchday.security.AuthCookieService;
import com.matchday.security.JwtPrincipal;
import com.matchday.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;
    private final Duration tokenTtl;

    public AuthController(AuthService authService, AuthCookieService authCookieService,
                           JwtProperties jwtProperties) {
        this.authService = authService;
        this.authCookieService = authCookieService;
        this.tokenTtl = Duration.ofDays(jwtProperties.expirationDays());
    }

    /** Body keeps the token for native mobile clients (Bearer flow, unchanged) — browsers get
     *  the same token again via the Set-Cookie header below and simply never persist the body's
     *  copy (see frontend/mobile AuthService: response.token is only read on native builds). */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse body = authService.register(request);
        response.addHeader(HttpHeaders.SET_COOKIE, authCookieService.build(body.token(), tokenTtl).toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse body = authService.login(request);
        response.addHeader(HttpHeaders.SET_COOKIE, authCookieService.build(body.token(), tokenTtl).toString());
        return body;
    }

    @PostMapping("/forgot-password")
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
    }

    @PostMapping("/reset-password")
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
    }

    @PostMapping("/logout")
    public void logout(@AuthenticationPrincipal JwtPrincipal principal, HttpServletResponse response) {
        authService.logout(principal);
        response.addHeader(HttpHeaders.SET_COOKIE, authCookieService.clear().toString());
    }

    /** Le plan renvoyé au login est figé dans le JWT jusqu'à sa réémission ; cet endpoint
     *  relit l'utilisateur en base pour que le front puisse se resynchroniser après un
     *  changement d'abonnement Stripe (webhook) sans attendre une reconnexion. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal JwtPrincipal principal) {
        return authService.getCurrentUser(principal.userId());
    }

    @PatchMapping("/me")
    public UserResponse updateProfile(@AuthenticationPrincipal JwtPrincipal principal, @Valid @RequestBody UpdateProfileRequest request) {
        return authService.updateProfile(principal.userId(), request);
    }
}
