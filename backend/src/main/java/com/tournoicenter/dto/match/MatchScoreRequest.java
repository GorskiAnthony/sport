package com.tournoicenter.dto.match;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record MatchScoreRequest(
        Integer homeScore,
        Integer awayScore,
        @Min(0) @Max(10) Integer homeFairPlay,
        @Min(0) @Max(10) Integer awayFairPlay
) {
}
