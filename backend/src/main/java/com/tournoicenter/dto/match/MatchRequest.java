package com.tournoicenter.dto.match;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record MatchRequest(
        @NotNull Long tournamentId,
        @NotNull Long homeTeamId,
        @NotNull Long awayTeamId,
        @NotBlank String phase,
        @NotNull Instant date,
        String venue,
        Integer homeScore,
        Integer awayScore
) {
}
