package com.tournoicenter.dto.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Same shape used for create (tournamentId required, validated via @Valid)
 * and update (validation skipped; only non-null fields merged in the service).
 */
public record TeamRequest(
        @NotBlank String name,
        String club,
        String logo,
        @NotBlank String category,
        String contact,
        @NotNull Long tournamentId
) {
}
