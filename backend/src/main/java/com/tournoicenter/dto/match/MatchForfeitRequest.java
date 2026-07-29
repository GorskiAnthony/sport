package com.tournoicenter.dto.match;

import jakarta.validation.constraints.NotNull;

public record MatchForfeitRequest(@NotNull Long teamId) {
}
