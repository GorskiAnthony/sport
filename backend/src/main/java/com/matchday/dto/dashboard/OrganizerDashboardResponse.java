package com.matchday.dto.dashboard;

import com.matchday.dto.match.MatchResponse;

import java.util.List;

public record OrganizerDashboardResponse(
        TournamentStatusCounts tournaments,
        long teamsCount,
        MatchStatusCounts matches,
        PlanUsageResponse plan,
        List<MatchResponse> upcomingMatches
) {
}
