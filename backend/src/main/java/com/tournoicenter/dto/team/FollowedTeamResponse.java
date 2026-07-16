package com.tournoicenter.dto.team;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.TournamentStatus;
import com.tournoicenter.dto.match.MatchResponse;

public record FollowedTeamResponse(
        TeamResponse team,
        String tournamentName,
        TournamentStatus tournamentStatus,
        MatchResponse nextMatch,
        MatchResponse lastMatch
) {
    public static FollowedTeamResponse of(Team team, Match nextMatch, Match lastMatch) {
        return new FollowedTeamResponse(
                TeamResponse.from(team),
                team.getTournament().getName(),
                team.getTournament().getStatus(),
                nextMatch != null ? MatchResponse.from(nextMatch) : null,
                lastMatch != null ? MatchResponse.from(lastMatch) : null
        );
    }
}
