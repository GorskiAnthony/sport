package com.matchday.dto.team;

import com.matchday.domain.Match;
import com.matchday.domain.Team;
import com.matchday.domain.TournamentStatus;
import com.matchday.dto.match.MatchResponse;

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
