package com.matchday.service;

import com.matchday.config.CorsProperties;
import com.matchday.domain.PasswordResetToken;
import com.matchday.domain.User;
import com.matchday.dto.auth.AuthResponse;
import com.matchday.dto.auth.LoginRequest;
import com.matchday.dto.auth.RegisterRequest;
import com.matchday.dto.auth.UpdateProfileRequest;
import com.matchday.dto.auth.UserResponse;
import com.matchday.exception.AccountLockedException;
import com.matchday.exception.EmailNotFoundException;
import com.matchday.exception.EmailTakenException;
import com.matchday.exception.InvalidResetTokenException;
import com.matchday.exception.ResourceNotFoundException;
import com.matchday.exception.WrongPasswordException;
import com.matchday.repository.PasswordResetTokenRepository;
import com.matchday.repository.UserRepository;
import com.matchday.security.JwtPrincipal;
import com.matchday.security.JwtService;
import com.matchday.security.LoginAttemptService;
import com.matchday.security.TokenRevocationService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class AuthService {

    private static final Duration RESET_TOKEN_TTL = Duration.ofHours(1);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailJsClient emailJsClient;
    private final CorsProperties corsProperties;
    private final TokenRevocationService tokenRevocationService;
    private final LoginAttemptService loginAttemptService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository, PasswordResetTokenRepository passwordResetTokenRepository,
                        PasswordEncoder passwordEncoder, JwtService jwtService, EmailJsClient emailJsClient,
                        CorsProperties corsProperties, TokenRevocationService tokenRevocationService,
                        LoginAttemptService loginAttemptService) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailJsClient = emailJsClient;
        this.corsProperties = corsProperties;
        this.tokenRevocationService = tokenRevocationService;
        this.loginAttemptService = loginAttemptService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailTakenException();
        }

        User user = new User(request.email(), passwordEncoder.encode(request.password()), request.name(), request.roleOrDefault());
        userRepository.save(user);

        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    public AuthResponse login(LoginRequest request) {
        if (loginAttemptService.isLocked(request.email())) {
            throw new AccountLockedException();
        }

        User user = userRepository.findByEmail(request.email()).orElseThrow(EmailNotFoundException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            loginAttemptService.recordFailure(request.email());
            throw new WrongPasswordException();
        }
        loginAttemptService.recordSuccess(request.email());

        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    /**
     * Always responds identically (success, no body) whether or not the email is registered, and
     * regardless of whether the email send itself succeeds — any distinguishable response here
     * (a 404, a different shape, a surfaced send failure) would let an attacker enumerate registered
     * accounts. The token itself is never returned to the caller; it's only ever delivered inside
     * the email EmailJS sends on the backend's behalf.
     */
    @Transactional
    public void forgotPassword(String email) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty()) {
            return;
        }

        passwordResetTokenRepository.deleteByUserId(user.get().getId());
        String token = generateToken();
        passwordResetTokenRepository.save(new PasswordResetToken(user.get(), token, Instant.now().plus(RESET_TOKEN_TTL)));

        String resetLink = corsProperties.allowedOrigin() + "/reset-password?token=" + token;
        emailJsClient.sendPasswordResetEmail(email, resetLink);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(InvalidResetTokenException::new);

        if (resetToken.isExpired()) {
            throw new InvalidResetTokenException();
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetTokenRepository.deleteByUserId(user.getId());
    }

    /** Without this, "logout" was purely a client-side localStorage clear — the token itself
     *  stayed valid (usable by anyone who'd captured it) for up to its full 7-day lifetime. */
    public void logout(JwtPrincipal principal) {
        tokenRevocationService.revoke(principal.tokenId());
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        user.setName(request.name());
        user.setAvatarUrl(request.avatarUrl());
        user.setBannerUrl(request.bannerUrl());
        userRepository.save(user);
        return UserResponse.from(user);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
