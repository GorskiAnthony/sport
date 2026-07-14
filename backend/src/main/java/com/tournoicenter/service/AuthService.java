package com.tournoicenter.service;

import com.tournoicenter.domain.User;
import com.tournoicenter.dto.auth.AuthResponse;
import com.tournoicenter.dto.auth.LoginRequest;
import com.tournoicenter.dto.auth.RegisterRequest;
import com.tournoicenter.dto.auth.UserResponse;
import com.tournoicenter.exception.EmailNotFoundException;
import com.tournoicenter.exception.EmailTakenException;
import com.tournoicenter.exception.WrongPasswordException;
import com.tournoicenter.repository.UserRepository;
import com.tournoicenter.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
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

    public void forgotPassword(String email) {
        userRepository.findByEmail(email).orElseThrow(EmailNotFoundException::new);
        // TODO: envoyer l'email de réinitialisation via un provider (SendGrid/Resend/...).
    }
}
