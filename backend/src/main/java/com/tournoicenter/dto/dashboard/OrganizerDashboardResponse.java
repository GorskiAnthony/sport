package com.tournoicenter.dto.dashboard;

import com.tournoicenter.dto.match.MatchResponse;

import java.util.List;

public record OrganizerDashboardResponse(
        TournamentStatusCounts tournaments,
        long teamsCount,
        MatchStatusCounts matches,
        PlanUsageResponse plan,
        List<MatchResponse> upcomingMatches
) {
}
