package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;

import java.util.List;

public interface BracketGenerator {

    boolean supports(TournamentFormat format);

    List<Match> generateInitialRound(Tournament tournament, List<Team> teams);
}
