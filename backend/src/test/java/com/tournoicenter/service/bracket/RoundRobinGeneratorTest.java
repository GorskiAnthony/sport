package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RoundRobinGeneratorTest {

    private final RoundRobinGenerator generator = new RoundRobinGenerator();

    private Tournament tournament() {
        return new Tournament("Test Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 3), 14, null);
    }

    @Test
    void generatesEveryUniquePairExactlyOnce() {
        Tournament tournament = tournament();
        Team a = new Team("A", "u15", tournament);
        Team b = new Team("B", "u15", tournament);
        Team c = new Team("C", "u15", tournament);
        Team d = new Team("D", "u15", tournament);

        List<Match> matches = generator.generateInitialRound(tournament, List.of(a, b, c, d));

        assertThat(matches).hasSize(6);
        long distinctPairs = matches.stream()
                .map(m -> Set.of(m.getHomeTeam(), m.getAwayTeam()))
                .distinct()
                .count();
        assertThat(distinctPairs).isEqualTo(6);
        assertThat(matches).allSatisfy(m -> {
            assertThat(m.getHomeTeam()).isNotEqualTo(m.getAwayTeam());
            assertThat(m.getPhase()).isEqualTo("Poule unique");
            assertThat(m.getDate()).isNotNull();
        });
    }

    @Test
    void supportsOnlyRoundRobinFormat() {
        assertThat(generator.supports(TournamentFormat.ROUND_ROBIN)).isTrue();
        assertThat(generator.supports(TournamentFormat.SINGLE_ELIMINATION)).isFalse();
    }
}
