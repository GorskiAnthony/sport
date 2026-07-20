package com.tournoicenter.dto.admin;

import com.tournoicenter.dto.dashboard.MatchStatusCounts;
import com.tournoicenter.dto.dashboard.TournamentStatusCounts;

import java.util.List;

public record AdminOverviewResponse(
        UserCounts users,
        TournamentStatusCounts tournaments,
        MatchStatusCounts matches,
        long totalTeams,
        List<PlanCount> planBreakdown,
        List<GrowthPoint> signups30d,
        List<GrowthPoint> tournamentsCreated30d
) {
}
