package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Ranks the teams in a single group from its finished matches — points (win=3/draw=1/loss=0)
 *  then goal difference, mirroring the frontend's computeStandings (shared/utils/standings.ts).
 *  Used only internally to decide which teams qualify for the knockout stage; never exposed
 *  via the API. No head-to-head tiebreak, same simplification the frontend already has — a
 *  genuine points-and-goal-difference tie resolves in an arbitrary (but stable) order. */
public final class GroupStandingsCalculator {

    private GroupStandingsCalculator() {
    }

    public record Standing(Team team, int points, int goalDifference) {
    }

    public static List<Standing> compute(List<Match> groupMatches) {
        // Keyed by Team reference (Team has no equals/hashCode override, so this is identity-based)
        // rather than Team.getId(), since ids are null for not-yet-persisted teams in unit tests.
        Map<Team, Integer> points = new LinkedHashMap<>();
        Map<Team, Integer> goalDifference = new LinkedHashMap<>();

        for (Match match : groupMatches) {
            Team home = match.getHomeTeam();
            Team away = match.getAwayTeam();
            points.putIfAbsent(home, 0);
            points.putIfAbsent(away, 0);
            goalDifference.putIfAbsent(home, 0);
            goalDifference.putIfAbsent(away, 0);

            Integer homeScore = match.getHomeScore();
            Integer awayScore = match.getAwayScore();
            if (homeScore == null || awayScore == null) {
                continue;
            }

            goalDifference.merge(home, homeScore - awayScore, Integer::sum);
            goalDifference.merge(away, awayScore - homeScore, Integer::sum);

            if (homeScore.equals(awayScore)) {
                points.merge(home, 1, Integer::sum);
                points.merge(away, 1, Integer::sum);
            } else if (homeScore > awayScore) {
                points.merge(home, 3, Integer::sum);
            } else {
                points.merge(away, 3, Integer::sum);
            }
        }

        List<Standing> standings = new ArrayList<>();
        for (Team team : points.keySet()) {
            standings.add(new Standing(team, points.get(team), goalDifference.get(team)));
        }

        return standings.stream()
                .sorted(Comparator.comparingInt(Standing::points).reversed()
                        .thenComparing(Comparator.comparingInt(Standing::goalDifference).reversed()))
                .toList();
    }
}
