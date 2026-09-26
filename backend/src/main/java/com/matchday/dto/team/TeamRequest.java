package com.matchday.dto.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Same shape used for create (tournamentId required, validated via @Valid)
 * and update (validation skipped; only non-null fields merged in the service).
 * The logo's actual content (format, magic bytes) is checked in TeamService, since @Size
 * here only runs on create — see ImageDataUrl.
 */
public record TeamRequest(
        @NotBlank String name,
        String club,
        @Size(max = 2_800_000, message = "Logo trop volumineux (max ~2 Mo).") String logo,
        @NotBlank String category,
        String contact,
        @NotNull Long tournamentId
) {
}
