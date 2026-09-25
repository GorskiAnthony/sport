package com.matchday.dto.admin;

import com.matchday.domain.Plan;
import com.matchday.domain.Role;

import java.time.Instant;
import java.util.List;

public record UserDetailResponse(
        Long id,
        String name,
        String email,
        Role role,
        Plan plan,
        Instant createdAt,
        String subscriptionStatus,
        List<TournamentSummaryResponse> tournaments
) {
}
