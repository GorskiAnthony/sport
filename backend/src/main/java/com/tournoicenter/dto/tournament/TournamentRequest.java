package com.tournoicenter.dto.tournament;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

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
        @Min(2) @Max(128) Integer maxTeams,
        String description,
        @Size(max = 5000) String rules,
        @Size(max = 1000) String terrains,
        @Size(max = 255) String sponsorName,
        String sponsorLogoUrl,
        String sponsorClickUrl,
        String format,
        Boolean splitEnabled,
        Boolean useEventPass
) {
}
