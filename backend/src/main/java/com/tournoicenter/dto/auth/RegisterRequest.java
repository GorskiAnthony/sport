package com.tournoicenter.dto.auth;

import com.tournoicenter.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 12) String password,
        Role role
) {
    public Role roleOrDefault() {
        return (role == Role.ORGANIZER || role == Role.SPECTATOR || role == Role.REFEREE) ? role : Role.ORGANIZER;
    }
}
