package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
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
        int totalPairs = teams.size() * (teams.size() - 1) / 2;
        List<Match> matches = new ArrayList<>(totalPairs);

        int index = 0;
        for (int i = 0; i < teams.size(); i++) {
            for (int j = i + 1; j < teams.size(); j++) {
                Instant date = spreadDate(tournament, index, totalPairs);
                matches.add(new Match(tournament, teams.get(i), teams.get(j), PHASE_LABEL, date));
                index++;
            }
        }
        return matches;
    }

    private Instant spreadDate(Tournament tournament, int index, int total) {
        LocalDate start = tournament.getStartDate();
        LocalDate end = tournament.getEndDate();
        long spanDays = ChronoUnit.DAYS.between(start, end);

        if (spanDays <= 0 || total <= 1) {
            return start.atTime(10 + (index % 8), 0).toInstant(ZoneOffset.UTC);
        }

        long dayOffset = Math.round((double) index / total * spanDays);
        return start.plusDays(dayOffset).atTime(10, 0).toInstant(ZoneOffset.UTC);
    }
}
