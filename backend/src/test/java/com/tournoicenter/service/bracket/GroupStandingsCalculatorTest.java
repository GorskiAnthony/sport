package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GroupStandingsCalculatorTest {

    private final Tournament tournament = new Tournament("Cup", "football", "u15", "Lyon",
            LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5), 20, null);

    private Match finished(Team home, Team away, int homeScore, int awayScore) {
        Match match = new Match(tournament, home, away, "Groupe A", Instant.now());
        match.setHomeScore(homeScore);
        match.setAwayScore(awayScore);
        match.setStatus(MatchStatus.FINISHED);
        return match;
    }

    @Test
    void ranksByPointsThenGoalDifference() {
        Team a = new Team("A", "u15", tournament);
        Team b = new Team("B", "u15", tournament);
        Team c = new Team("C", "u15", tournament);

        // A beats B 3-0, A beats C 1-0, B beats C 2-1
        // A: 6 pts, GD +4 | B: 3 pts, GD -1 | C: 0 pts, GD -3
        List<Match> matches = List.of(
                finished(a, b, 3, 0),
                finished(a, c, 1, 0),
                finished(b, c, 2, 1));

        List<GroupStandingsCalculator.Standing> standings = GroupStandingsCalculator.compute(matches);

        assertThat(standings).extracting(GroupStandingsCalculator.Standing::team)
                .containsExactly(a, b, c);
        assertThat(standings.get(0).points()).isEqualTo(6);
        assertThat(standings.get(1).points()).isEqualTo(3);
        assertThat(standings.get(2).points()).isEqualTo(0);
    }

    @Test
    void breaksPointsTieByGoalDifference() {
        Team a = new Team("A", "u15", tournament);
        Team b = new Team("B", "u15", tournament);
        Team c = new Team("C", "u15", tournament);
        Team d = new Team("D", "u15", tournament);

        // A beats B 4-0, C beats D 1-0, A and C both have 3 pts... construct so A/C tie on
        // points but differ on goal difference: A wins big, C wins narrowly.
        List<Match> matches = List.of(
                finished(a, b, 4, 0),
                finished(c, d, 1, 0));

        List<GroupStandingsCalculator.Standing> standings = GroupStandingsCalculator.compute(matches);

        // both A and C have 3 points; A has better goal difference (+4 vs +1) so ranks first
        assertThat(standings.get(0).team()).isEqualTo(a);
        assertThat(standings.get(1).team()).isEqualTo(c);
    }

    @Test
    void ignoresUnfinishedMatchesForScoringButStillCountsTeams() {
        Team a = new Team("A", "u15", tournament);
        Team b = new Team("B", "u15", tournament);
        Match scheduled = new Match(tournament, a, b, "Groupe A", Instant.now());

        List<GroupStandingsCalculator.Standing> standings = GroupStandingsCalculator.compute(List.of(scheduled));

        assertThat(standings).hasSize(2);
        assertThat(standings).allSatisfy(s -> {
            assertThat(s.points()).isEqualTo(0);
            assertThat(s.goalDifference()).isEqualTo(0);
        });
    }
}
