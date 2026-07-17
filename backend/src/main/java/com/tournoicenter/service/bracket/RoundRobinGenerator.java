package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Generates every unique pair of teams exactly once ("everybody plays everybody").
 * All matches are produced in a single pass since the full schedule is known upfront.
 */
@Component
public class RoundRobinGenerator implements BracketGenerator {

    private static final String PHASE_LABEL = "Poule unique";

    @Override
    public boolean supports(TournamentFormat format) {
        return format == TournamentFormat.ROUND_ROBIN;
    }

    @Override
    public List<Match> generateInitialRound(Tournament tournament, List<Team> teams) {
        return RoundRobinPairing.pairEveryTeamOnce(tournament, teams, PHASE_LABEL);
    }
}
