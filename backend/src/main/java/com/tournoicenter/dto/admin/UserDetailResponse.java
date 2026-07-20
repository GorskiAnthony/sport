package com.tournoicenter.dto.admin;

import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Role;

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
