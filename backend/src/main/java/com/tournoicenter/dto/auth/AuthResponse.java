package com.tournoicenter.dto.auth;

public record AuthResponse(String token, UserResponse user) {
}
