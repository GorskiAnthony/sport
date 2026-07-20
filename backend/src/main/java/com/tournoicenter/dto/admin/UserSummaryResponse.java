package com.tournoicenter.dto.admin;

import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Role;

import java.time.Instant;

public record UserSummaryResponse(
        Long id,
        String name,
        String email,
        Role role,
        Plan plan,
        Instant createdAt,
        long tournamentsCount
) {
}
