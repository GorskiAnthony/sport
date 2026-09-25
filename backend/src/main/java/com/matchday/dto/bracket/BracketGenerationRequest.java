package com.matchday.dto.bracket;

import com.matchday.domain.TournamentFormat;
import jakarta.validation.constraints.NotNull;

public record BracketGenerationRequest(@NotNull TournamentFormat format, Integer groupCount) {
}
