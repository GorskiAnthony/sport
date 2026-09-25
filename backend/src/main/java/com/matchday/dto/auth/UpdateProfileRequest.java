package com.matchday.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 2_800_000, message = "Photo trop volumineuse (max ~2 Mo).") String avatarUrl,
        @Size(max = 5_600_000, message = "Bannière trop volumineuse (max ~4 Mo).") String bannerUrl
) {
}
