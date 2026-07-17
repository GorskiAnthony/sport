package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/** Shared "everybody plays everybody once" pairing + date-spreading, used by both
 *  RoundRobinGenerator (single pool) and GroupKnockoutGenerator (one pool per group). */
final class RoundRobinPairing {

    private RoundRobinPairing() {
    }

    static List<Match> pairEveryTeamOnce(Tournament tournament, List<Team> teams, String phaseLabel) {
        int totalPairs = teams.size() * (teams.size() - 1) / 2;
        List<Match> matches = new ArrayList<>(totalPairs);

        int index = 0;
        for (int i = 0; i < teams.size(); i++) {
            for (int j = i + 1; j < teams.size(); j++) {
                Instant date = spreadDate(tournament, index, totalPairs);
                matches.add(new Match(tournament, teams.get(i), teams.get(j), phaseLabel, date));
                index++;
            }
        }
        return matches;
    }

    private static Instant spreadDate(Tournament tournament, int index, int total) {
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
