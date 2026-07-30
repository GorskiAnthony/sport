package com.tournoicenter.dto.match;

import jakarta.validation.constraints.NotNull;

/** delta is normally ±1 (one tap = one goal, or a misclick correction) — no bound enforced
 *  beyond the score never going below 0 (see MatchService.recordGoal). */
public record MatchGoalRequest(@NotNull TeamSide team, int delta) {
}
