package com.matchday.dto.match;

import com.matchday.domain.Match;
import com.matchday.domain.MatchStatus;
import com.matchday.dto.team.TeamResponse;

import java.time.Instant;

public record MatchResponse(
        Long id,
        Long tournamentId,
        String tournamentName,
        TeamResponse homeTeam,
        TeamResponse awayTeam,
        Integer homeScore,
        Integer awayScore,
        Integer homeFairPlay,
        Integer awayFairPlay,
        Long forfeitedTeamId,
        String phase,
        Instant date,
        String venue,
        MatchStatus status,
        String events,
        String stats,
        Instant createdAt,
        Instant updatedAt
) {
    public static MatchResponse from(Match match) {
        return new MatchResponse(
                match.getId(), match.getTournament().getId(), match.getTournament().getName(),
                TeamResponse.from(match.getHomeTeam()), TeamResponse.from(match.getAwayTeam()),
                match.getHomeScore(), match.getAwayScore(), match.getHomeFairPlay(), match.getAwayFairPlay(),
                match.getForfeitedTeam() != null ? match.getForfeitedTeam().getId() : null,
                match.getPhase(), match.getDate(),
                match.getVenue(), match.getStatus(), match.getEvents(), match.getStats(),
                match.getCreatedAt(), match.getUpdatedAt()
        );
    }
}
