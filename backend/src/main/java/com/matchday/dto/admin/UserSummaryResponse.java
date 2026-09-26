package com.matchday.dto.admin;

import com.matchday.domain.Plan;
import com.matchday.domain.Role;

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
