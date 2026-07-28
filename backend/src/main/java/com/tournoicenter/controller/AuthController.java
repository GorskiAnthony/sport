package com.tournoicenter.controller;

import com.tournoicenter.dto.auth.AuthResponse;
import com.tournoicenter.dto.auth.ForgotPasswordRequest;
import com.tournoicenter.dto.auth.LoginRequest;
import com.tournoicenter.dto.auth.RegisterRequest;
import com.tournoicenter.dto.auth.ResetPasswordRequest;
import com.tournoicenter.dto.auth.UserResponse;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
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
    public void logout(@AuthenticationPrincipal JwtPrincipal principal) {
        authService.logout(principal);
    }

    /** Le plan renvoyé au login est figé dans le JWT jusqu'à sa réémission ; cet endpoint
     *  relit l'utilisateur en base pour que le front puisse se resynchroniser après un
     *  changement d'abonnement Stripe (webhook) sans attendre une reconnexion. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal JwtPrincipal principal) {
        return authService.getCurrentUser(principal.userId());
    }
}
