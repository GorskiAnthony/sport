package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;
import com.tournoicenter.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GroupKnockoutGeneratorTest {

    private final GroupKnockoutGenerator generator = new GroupKnockoutGenerator();

    private Tournament tournament() {
        return new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 10), 20, null);
    }

    private List<Team> teams(Tournament tournament, int count) {
        List<Team> teams = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            teams.add(new Team("Team " + i, "u15", tournament));
        }
        return teams;
    }

    @Test
    void supportsOnlyGroupKnockoutFormat() {
        assertThat(generator.supports(TournamentFormat.GROUP_KNOCKOUT)).isTrue();
        assertThat(generator.supports(TournamentFormat.ROUND_ROBIN)).isFalse();
        assertThat(generator.supports(TournamentFormat.SINGLE_ELIMINATION)).isFalse();
    }

    @Test
    void assignsEveryTeamToExactlyOneGroupWithEvenSizes() {
        Tournament tournament = tournament();
        List<Team> teams = teams(tournament, 10); // 3 groups -> sizes 4/3/3

        List<Match> matches = generator.generateInitialRound(tournament, teams, 3);

        Set<String> phases = matches.stream().map(Match::getPhase).collect(java.util.stream.Collectors.toSet());
        assertThat(phases).containsExactlyInAnyOrder("Groupe A", "Groupe B", "Groupe C");

        // every team appears in exactly one group's matches
        for (Team team : teams) {
            Set<String> groupsForTeam = new HashSet<>();
            for (Match match : matches) {
                if (match.getHomeTeam() == team || match.getAwayTeam() == team) {
                    groupsForTeam.add(match.getPhase());
                }
            }
            assertThat(groupsForTeam).hasSize(1);
        }

        // total matches = C(4,2) + C(3,2) + C(3,2) = 6 + 3 + 3 = 12
        assertThat(matches).hasSize(12);
    }

    @Test
    void rejectsMissingGroupCount() {
        Tournament tournament = tournament();
        assertThatThrownBy(() -> generator.generateInitialRound(tournament, teams(tournament, 9), null))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsTooManyGroupsForTeamCount() {
        Tournament tournament = tournament();
        // 5 teams / 3 groups -> smallest group would have 1 team, below the 3-team minimum
        assertThatThrownBy(() -> generator.generateInitialRound(tournament, teams(tournament, 5), 3))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsZeroOrNegativeGroupCount() {
        Tournament tournament = tournament();
        assertThatThrownBy(() -> generator.generateInitialRound(tournament, teams(tournament, 9), 0))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void isGroupPhaseDetectsGroupLabelsOnly() {
        assertThat(GroupKnockoutGenerator.isGroupPhase("Groupe A")).isTrue();
        assertThat(GroupKnockoutGenerator.isGroupPhase("Quarts de finale")).isFalse();
        assertThat(GroupKnockoutGenerator.isGroupPhase(null)).isFalse();
    }
}
