package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SingleEliminationGeneratorTest {

    private final SingleEliminationGenerator generator = new SingleEliminationGenerator();

    private Tournament tournament() {
        return new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5), 14, null);
    }

    private List<Team> teams(Tournament tournament, int count) {
        List<Team> teams = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            teams.add(new Team("Team " + (char) ('A' + i), "u15", tournament));
        }
        return teams;
    }

    @Test
    void powerOfTwoHasNoByesAndPairsEveryTeam() {
        Tournament tournament = tournament();
        List<Team> teams = teams(tournament, 4);

        assertThat(generator.computeByeTeams(teams)).isEmpty();

        List<Match> round1 = generator.generateInitialRound(tournament, teams);
        assertThat(round1).hasSize(2);
        assertThat(round1).allSatisfy(m -> assertThat(m.getPhase()).isEqualTo("Demi-finales"));
    }

    @Test
    void nonPowerOfTwoGivesByesToLastTeams() {
        Tournament tournament = tournament();
        List<Team> teams = teams(tournament, 6); // bracketSize=8, byeCount=2

        List<Team> byeTeams = generator.computeByeTeams(teams);
        assertThat(byeTeams).containsExactly(teams.get(4), teams.get(5));

        List<Match> round1 = generator.generateInitialRound(tournament, teams);
        assertThat(round1).hasSize(2); // only the 4 non-bye teams play round 1
        assertThat(round1).allSatisfy(m -> assertThat(m.getPhase()).isEqualTo("Quarts de finale"));
    }

    @Test
    void advanceCombinesWinnersWithByeTeamsForNextRound() {
        Tournament tournament = tournament();
        List<Team> teams = teams(tournament, 6);
        List<Team> byeTeams = generator.computeByeTeams(teams);
        List<Match> round1 = generator.generateInitialRound(tournament, teams);
        finishWithHomeWin(round1);

        BracketAdvanceResult result = generator.advance(tournament, round1, byeTeams, 1);

        assertThat(result.isComplete()).isFalse();
        assertThat(result.nextRoundMatches()).hasSize(2); // 2 round-1 winners + 2 byes = 4 participants
        assertThat(result.nextRoundMatches()).allSatisfy(m -> assertThat(m.getPhase()).isEqualTo("Demi-finales"));
    }

    @Test
    void advanceRejectsUnfinishedMatch() {
        Tournament tournament = tournament();
        List<Match> round1 = generator.generateInitialRound(tournament, teams(tournament, 2));

        assertThatThrownBy(() -> generator.advance(tournament, round1, List.of(), 1))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void advanceRejectsDraw() {
        Tournament tournament = tournament();
        List<Match> round1 = generator.generateInitialRound(tournament, teams(tournament, 2));
        round1.get(0).setHomeScore(1);
        round1.get(0).setAwayScore(1);
        round1.get(0).setStatus(MatchStatus.FINISHED);

        assertThatThrownBy(() -> generator.advance(tournament, round1, List.of(), 1))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void advanceDeclaresChampionWhenOneTeamRemains() {
        Tournament tournament = tournament();
        List<Team> teams = teams(tournament, 2);
        List<Match> finalRound = generator.generateInitialRound(tournament, teams);
        finishWithHomeWin(finalRound);

        BracketAdvanceResult result = generator.advance(tournament, finalRound, List.of(), 1);

        assertThat(result.isComplete()).isTrue();
        assertThat(result.champion()).isEqualTo(teams.get(0));
    }

    @Test
    void advanceCreditsWinToTheNonForfeitingTeam() {
        Tournament tournament = tournament();
        List<Team> teams = teams(tournament, 4);
        List<Match> round1 = generator.generateInitialRound(tournament, teams);
        // Match 0: home team forfeits, away team should advance without any score.
        round1.get(0).setStatus(MatchStatus.FORFEIT);
        round1.get(0).setForfeitedTeam(round1.get(0).getHomeTeam());
        finishWithHomeWin(List.of(round1.get(1)));

        BracketAdvanceResult result = generator.advance(tournament, round1, List.of(), 1);

        assertThat(result.nextRoundMatches()).hasSize(1);
        Match finalMatch = result.nextRoundMatches().get(0);
        assertThat(List.of(finalMatch.getHomeTeam(), finalMatch.getAwayTeam()))
                .containsExactlyInAnyOrder(round1.get(0).getAwayTeam(), round1.get(1).getHomeTeam());
    }

    private void finishWithHomeWin(List<Match> matches) {
        for (Match match : matches) {
            match.setHomeScore(2);
            match.setAwayScore(0);
            match.setStatus(MatchStatus.FINISHED);
        }
    }
}
