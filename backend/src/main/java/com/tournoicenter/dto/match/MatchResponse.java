package com.tournoicenter.dto.match;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.dto.team.TeamResponse;

import java.time.Instant;

public record MatchResponse(
        Long id,
        Long tournamentId,
        TeamResponse homeTeam,
        TeamResponse awayTeam,
        Integer homeScore,
        Integer awayScore,
        Integer homeFairPlay,
        Integer awayFairPlay,
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
                match.getId(), match.getTournament().getId(),
                TeamResponse.from(match.getHomeTeam()), TeamResponse.from(match.getAwayTeam()),
                match.getHomeScore(), match.getAwayScore(), match.getHomeFairPlay(), match.getAwayFairPlay(),
                match.getPhase(), match.getDate(),
                match.getVenue(), match.getStatus(), match.getEvents(), match.getStats(),
                match.getCreatedAt(), match.getUpdatedAt()
        );
    }
}
