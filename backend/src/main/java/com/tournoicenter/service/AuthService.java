package com.tournoicenter.service;

import com.tournoicenter.config.CorsProperties;
import com.tournoicenter.domain.PasswordResetToken;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.auth.AuthResponse;
import com.tournoicenter.dto.auth.LoginRequest;
import com.tournoicenter.dto.auth.RegisterRequest;
import com.tournoicenter.dto.auth.UserResponse;
import com.tournoicenter.exception.AccountLockedException;
import com.tournoicenter.exception.EmailNotFoundException;
import com.tournoicenter.exception.EmailTakenException;
import com.tournoicenter.exception.InvalidResetTokenException;
import com.tournoicenter.exception.WrongPasswordException;
import com.tournoicenter.repository.PasswordResetTokenRepository;
import com.tournoicenter.repository.UserRepository;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.security.JwtService;
import com.tournoicenter.security.LoginAttemptService;
import com.tournoicenter.security.TokenRevocationService;
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

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
