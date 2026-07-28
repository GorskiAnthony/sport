package com.tournoicenter.dto.tournament;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Same shape used for create (all @NotBlank/@NotNull fields required, validated via @Valid)
 * and update (validation skipped by the controller; only non-null fields are merged in the service).
 */
public record TournamentRequest(
        @NotBlank String name,
        @NotBlank String sport,
        @NotBlank String category,
        String location,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @Min(2) @Max(48) Integer maxTeams,
        String description,
        String format,
        Boolean splitEnabled,
        Boolean useEventPass
) {
}
