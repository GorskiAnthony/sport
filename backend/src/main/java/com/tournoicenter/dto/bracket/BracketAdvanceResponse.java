package com.tournoicenter.dto.bracket;

import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.dto.team.TeamResponse;

import java.util.List;

public record BracketAdvanceResponse(List<MatchResponse> matches, boolean tournamentComplete, TeamResponse champion) {
}
