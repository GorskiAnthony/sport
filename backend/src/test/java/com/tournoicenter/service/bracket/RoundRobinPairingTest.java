package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/** Covers the "circle method" rotation directly (RoundRobinGeneratorTest/GroupKnockoutGeneratorTest
 *  only check that every pair is generated once, not that the rest rotation is actually fair). */
class RoundRobinPairingTest {

    private Tournament singleDayTournament() {
        return new Tournament("Cup", "football", "u9", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), 14, null);
    }

    private List<Team> teams(Tournament tournament, int count) {
        List<Team> teams = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            teams.add(new Team("Team " + i, "u9", tournament));
        }
        return teams;
    }

    private Map<Instant, List<Match>> byRound(List<Match> matches) {
        return matches.stream().collect(Collectors.groupingBy(Match::getDate));
    }

    @Test
    void evenTeamCountNeverPlaysTwiceInTheSameRound() {
        Tournament tournament = singleDayTournament();
        List<Team> teams = teams(tournament, 8);

        List<Match> matches = RoundRobinPairing.pairEveryTeamOnce(tournament, teams, "Poule unique");

        assertThat(matches).hasSize(28); // C(8,2)
        Map<Instant, List<Match>> rounds = byRound(matches);
        assertThat(rounds).hasSize(7); // n-1 rounds for an even team count

        for (List<Match> roundMatches : rounds.values()) {
            assertThat(roundMatches).hasSize(4); // 8 teams / 2 per match
            Set<Team> playing = new HashSet<>();
            for (Match match : roundMatches) {
                assertThat(playing.add(match.getHomeTeam())).as("team plays once per round").isTrue();
                assertThat(playing.add(match.getAwayTeam())).as("team plays once per round").isTrue();
            }
            assertThat(playing).hasSize(8); // every team appears exactly once
        }
    }

    @Test
    void oddTeamCountGivesEveryTeamExactlyOneByeRound() {
        Tournament tournament = singleDayTournament();
        List<Team> teams = teams(tournament, 5);

        List<Match> matches = RoundRobinPairing.pairEveryTeamOnce(tournament, teams, "Poule unique");

        assertThat(matches).hasSize(10); // C(5,2)
        Map<Instant, List<Match>> rounds = byRound(matches);
        assertThat(rounds).hasSize(5); // odd team count uses n rounds (one bye seat per round)

        for (Team team : teams) {
            long roundsPlayed = rounds.values().stream()
                    .filter(roundMatches -> roundMatches.stream()
                            .anyMatch(m -> m.getHomeTeam() == team || m.getAwayTeam() == team))
                    .count();
            assertThat(roundsPlayed).as("team " + team.getName() + " rests exactly one round").isEqualTo(4);
        }
    }

    @Test
    void roundsAreSpacedApartSoATeamNeverPlaysBackToBack() {
        Tournament tournament = singleDayTournament();
        List<Team> teams = teams(tournament, 6);

        List<Match> matches = RoundRobinPairing.pairEveryTeamOnce(tournament, teams, "Poule unique");

        List<Instant> distinctRoundDates = matches.stream().map(Match::getDate).distinct().sorted().toList();
        assertThat(distinctRoundDates).hasSize(5); // 6 teams -> 5 rounds

        // Consecutive rounds must be strictly after one another (real time gap for rest).
        for (int i = 1; i < distinctRoundDates.size(); i++) {
            assertThat(distinctRoundDates.get(i)).isAfter(distinctRoundDates.get(i - 1));
        }
    }

    @Test
    void groupsShareTheSameRoundTimeSlotsForParallelPlay() {
        Tournament tournament = singleDayTournament();
        List<Team> groupA = teams(tournament, 4);
        List<Team> groupB = teams(tournament, 3);

        List<Match> matches = RoundRobinPairing.pairAllGroups(
                tournament, List.of(groupA, groupB), List.of("Groupe A", "Groupe B"));

        assertThat(matches).hasSize(6 + 3); // C(4,2) + C(3,2)

        Set<Instant> groupADates = matches.stream()
                .filter(m -> "Groupe A".equals(m.getPhase())).map(Match::getDate).collect(Collectors.toSet());
        Set<Instant> groupBDates = matches.stream()
                .filter(m -> "Groupe B".equals(m.getPhase())).map(Match::getDate).collect(Collectors.toSet());

        // Every slot used by the smaller group must be one also used by the larger group
        // (same kickoff times), so pools can run in parallel on different pitches.
        assertThat(groupADates).containsAll(groupBDates);
    }
}
