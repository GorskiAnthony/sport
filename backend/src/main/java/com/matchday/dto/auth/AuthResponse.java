package com.matchday.dto.auth;

public record AuthResponse(String token, UserResponse user) {
}
