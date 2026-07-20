package com.tournoicenter.service;

import com.tournoicenter.domain.PasswordResetToken;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.auth.AuthResponse;
import com.tournoicenter.dto.auth.ForgotPasswordResponse;
import com.tournoicenter.dto.auth.LoginRequest;
import com.tournoicenter.dto.auth.RegisterRequest;
import com.tournoicenter.dto.auth.UserResponse;
import com.tournoicenter.exception.EmailNotFoundException;
import com.tournoicenter.exception.EmailTakenException;
import com.tournoicenter.exception.InvalidResetTokenException;
import com.tournoicenter.exception.WrongPasswordException;
import com.tournoicenter.repository.PasswordResetTokenRepository;
import com.tournoicenter.repository.UserRepository;
import com.tournoicenter.security.JwtService;
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
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository, PasswordResetTokenRepository passwordResetTokenRepository,
                        PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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
        User user = userRepository.findByEmail(request.email()).orElseThrow(EmailNotFoundException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new WrongPasswordException();
        }

        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    /**
     * Always returns a same-shaped, same-status response whether or not the email is registered —
     * a distinct 404/leak here would let an attacker enumerate registered accounts. Only the
     * registered-account branch actually persists a usable token; the other branch's token is
     * generated but never saved, so it silently fails validation if anyone tries it.
     */
    @Transactional
    public ForgotPasswordResponse forgotPassword(String email) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty()) {
            return new ForgotPasswordResponse(generateToken());
        }

        passwordResetTokenRepository.deleteByUserId(user.get().getId());
        String token = generateToken();
        passwordResetTokenRepository.save(new PasswordResetToken(user.get(), token, Instant.now().plus(RESET_TOKEN_TTL)));
        return new ForgotPasswordResponse(token);
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

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
