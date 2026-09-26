package com.matchday.service.bracket;

import com.matchday.domain.Match;
import com.matchday.domain.Team;
import com.matchday.domain.Tournament;
import com.matchday.domain.TournamentFormat;

import java.util.List;

public interface BracketGenerator {

    boolean supports(TournamentFormat format);

    List<Match> generateInitialRound(Tournament tournament, List<Team> teams);

    /** Overload for formats needing extra generation-time config (e.g. GROUP_KNOCKOUT's
     *  organizer-chosen group count). Defaults to the 2-arg version so formats that don't
     *  need extra config are unaffected. */
    default List<Match> generateInitialRound(Tournament tournament, List<Team> teams, Integer groupCount) {
        return generateInitialRound(tournament, teams);
    }
}
