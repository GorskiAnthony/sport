package com.matchday.dto.dashboard;

import com.matchday.domain.Plan;
import com.matchday.service.PlanLimits;

public record PlanUsageResponse(
        Plan plan,
        long usedTournaments,
        int maxTournaments,
        int maxTeamsPerTournament,
        boolean realtimeEnabled,
        boolean customRulesEnabled
) {
    public static PlanUsageResponse of(Plan plan, long usedTournaments) {
        PlanLimits limits = PlanLimits.of(plan);
        return new PlanUsageResponse(
                plan, usedTournaments, limits.maxTournaments(),
                limits.maxTeams(), limits.realtime(), limits.customRules()
        );
    }
}
