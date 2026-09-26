package com.matchday.dto.bracket;

import com.matchday.dto.match.MatchResponse;
import com.matchday.dto.team.TeamResponse;

import java.util.List;

public record BracketAdvanceResponse(List<MatchResponse> matches, boolean tournamentComplete, TeamResponse champion) {
}
