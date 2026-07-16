package com.tournoicenter.dto.bracket;

import com.tournoicenter.domain.TournamentFormat;
import jakarta.validation.constraints.NotNull;

public record BracketGenerationRequest(@NotNull TournamentFormat format, Integer groupCount) {
}
