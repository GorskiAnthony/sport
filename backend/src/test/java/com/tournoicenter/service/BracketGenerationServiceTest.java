package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.bracket.BracketAdvanceResponse;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import com.tournoicenter.service.bracket.GroupKnockoutGenerator;
import com.tournoicenter.service.bracket.RoundRobinGenerator;
import com.tournoicenter.service.bracket.SingleEliminationGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BracketGenerationServiceTest {

    @Mock
    private TournamentRepository tournamentRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private MatchRepository matchRepository;
    @Mock
    private TournamentLiveService tournamentLiveService;

    private BracketGenerationService service;

    @BeforeEach
    void setUp() {
        service = new BracketGenerationService(
                tournamentRepository, teamRepository, matchRepository,
                List.of(new RoundRobinGenerator(), new SingleEliminationGenerator(), new GroupKnockoutGenerator()),
                new SingleEliminationGenerator(), tournamentLiveService);
    }

    private Tournament tournamentOwnedBy(Long organizerId) {
        User organizer = mock(User.class);
        when(organizer.getId()).thenReturn(organizerId);
        return new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5), 14, organizer);
    }

    @Test
    void rejectsGenerationFromNonOwner() {
        Tournament tournament = tournamentOwnedBy(1L);
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));

        assertThatThrownBy(() -> service.generate(10L, 2L, TournamentFormat.ROUND_ROBIN))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void rejectsGenerationWithFewerThanTwoTeams() {
        Tournament tournament = tournamentOwnedBy(1L);
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(teamRepository.findByTournamentIdOrderByNameAsc(10L))
                .thenReturn(List.of(new Team("A", "u15", tournament)));

        assertThatThrownBy(() -> service.generate(10L, 1L, TournamentFormat.ROUND_ROBIN))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsGenerationWhenMatchesAlreadyExist() {
        Tournament tournament = tournamentOwnedBy(1L);
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(teamRepository.findByTournamentIdOrderByNameAsc(10L)).thenReturn(
                List.of(new Team("A", "u15", tournament), new Team("B", "u15", tournament)));
        when(matchRepository.findByTournamentIdOrderByDateAsc(10L)).thenReturn(List.of(mock(Match.class)));

        assertThatThrownBy(() -> service.generate(10L, 1L, TournamentFormat.ROUND_ROBIN))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void generatesRoundRobinMatchesForValidTournament() {
        Tournament tournament = tournamentOwnedBy(1L);
        Team a = new Team("A", "u15", tournament);
        Team b = new Team("B", "u15", tournament);
        Team c = new Team("C", "u15", tournament);
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(teamRepository.findByTournamentIdOrderByNameAsc(10L)).thenReturn(List.of(a, b, c));
        when(matchRepository.findByTournamentIdOrderByDateAsc(10L)).thenReturn(List.of());
        when(matchRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        List<MatchResponse> result = service.generate(10L, 1L, TournamentFormat.ROUND_ROBIN);

        assertThat(result).hasSize(3); // 3 teams round robin = 3 matches
        assertThat(tournament.getFormat()).isEqualTo("ROUND_ROBIN");
    }

    @Test
    void generatesGroupKnockoutMatchesForValidTournament() {
        Tournament tournament = tournamentOwnedBy(1L);
        List<Team> teams = new ArrayList<>();
        for (int i = 0; i < 6; i++) teams.add(new Team("Team " + i, "u15", tournament));
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(teamRepository.findByTournamentIdOrderByNameAsc(10L)).thenReturn(teams);
        when(matchRepository.findByTournamentIdOrderByDateAsc(10L)).thenReturn(List.of());
        when(matchRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        List<MatchResponse> result = service.generate(10L, 1L, TournamentFormat.GROUP_KNOCKOUT, 2);

        assertThat(result).hasSize(6); // 2 groups of 3 -> 3 matches each
        assertThat(tournament.getFormat()).isEqualTo("GROUP_KNOCKOUT");
    }

    @Test
    void rejectsGroupKnockoutWithTooFewTeamsPerGroup() {
        Tournament tournament = tournamentOwnedBy(1L);
        List<Team> teams = new ArrayList<>();
        for (int i = 0; i < 5; i++) teams.add(new Team("Team " + i, "u15", tournament));
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(teamRepository.findByTournamentIdOrderByNameAsc(10L)).thenReturn(teams);
        when(matchRepository.findByTournamentIdOrderByDateAsc(10L)).thenReturn(List.of());

        assertThatThrownBy(() -> service.generate(10L, 1L, TournamentFormat.GROUP_KNOCKOUT, 3))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void advanceGroupKnockoutRejectsWhenGroupMatchesUnfinished() {
        Tournament tournament = tournamentOwnedBy(1L);
        tournament.setFormat("GROUP_KNOCKOUT");
        Team a = new Team("A", "u15", tournament);
        Team b = new Team("B", "u15", tournament);
        Match scheduled = new Match(tournament, a, b, "Groupe A", Instant.now());
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(matchRepository.findByTournamentIdOrderByDateAsc(10L)).thenReturn(List.of(scheduled));

        assertThatThrownBy(() -> service.advance(10L, 1L)).isInstanceOf(ApiException.class);
    }

    /** 3 groups of 3 teams: each group's winner takes all 3 matches (6 pts), so only 1 team
     *  per group qualifies (bottom 2 dropped from a 3-team group). 3 total qualifiers means a
     *  non-power-of-two knockout bracket (1 bye) — exactly the shape needed to exercise the
     *  qualifiers-not-all-teams bye recomputation on the next advance() call. */
    private List<Match> finishedGroupStageWithOneQualifierPerGroup(Tournament tournament, String groupLabel,
                                                                    Team winner, Team second, Team third) {
        List<Match> matches = new ArrayList<>();
        matches.add(finished(tournament, groupLabel, winner, second, 3, 0));
        matches.add(finished(tournament, groupLabel, winner, third, 3, 0));
        matches.add(finished(tournament, groupLabel, second, third, 2, 1));
        return matches;
    }

    private Match finished(Tournament tournament, String phase, Team home, Team away, int homeScore, int awayScore) {
        Match match = new Match(tournament, home, away, phase, Instant.now());
        match.setHomeScore(homeScore);
        match.setAwayScore(awayScore);
        match.setStatus(MatchStatus.FINISHED);
        return match;
    }

    @Test
    void advanceGroupKnockoutGeneratesKnockoutRoundOnceGroupsComplete() {
        Tournament tournament = tournamentOwnedBy(1L);
        tournament.setFormat("GROUP_KNOCKOUT");

        Team a1 = new Team("A1", "u15", tournament);
        Team a2 = new Team("A2", "u15", tournament);
        Team a3 = new Team("A3", "u15", tournament);
        Team b1 = new Team("B1", "u15", tournament);
        Team b2 = new Team("B2", "u15", tournament);
        Team b3 = new Team("B3", "u15", tournament);
        Team c1 = new Team("C1", "u15", tournament);
        Team c2 = new Team("C2", "u15", tournament);
        Team c3 = new Team("C3", "u15", tournament);

        List<Match> allMatches = new ArrayList<>();
        allMatches.addAll(finishedGroupStageWithOneQualifierPerGroup(tournament, "Groupe A", a1, a2, a3));
        allMatches.addAll(finishedGroupStageWithOneQualifierPerGroup(tournament, "Groupe B", b1, b2, b3));
        allMatches.addAll(finishedGroupStageWithOneQualifierPerGroup(tournament, "Groupe C", c1, c2, c3));

        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(matchRepository.findByTournamentIdOrderByDateAsc(10L)).thenReturn(allMatches);
        when(matchRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        BracketAdvanceResponse response = service.advance(10L, 1L);

        assertThat(response.tournamentComplete()).isFalse();
        // 3 qualifiers (A1, B1, C1) -> bracket size 4, 1 bye -> only 1 match in round 1
        assertThat(response.matches()).hasSize(1);
        MatchResponse round1 = response.matches().get(0);
        assertThat(round1.phase()).isEqualTo("Demi-finales");
        // Only group winners (A1, B1, C1) may appear — never a team eliminated in the group stage.
        assertThat(List.of(round1.homeTeam().name(), round1.awayTeam().name()))
                .isSubsetOf("A1", "B1", "C1");
    }

    @Test
    void advanceGroupKnockoutAdvancesExistingKnockoutRoundUsingOnlyQualifiedTeams() {
        Tournament tournament = tournamentOwnedBy(1L);
        tournament.setFormat("GROUP_KNOCKOUT");

        Team a1 = new Team("A1", "u15", tournament);
        Team a2 = new Team("A2", "u15", tournament);
        Team a3 = new Team("A3", "u15", tournament);
        Team b1 = new Team("B1", "u15", tournament);
        Team b2 = new Team("B2", "u15", tournament);
        Team b3 = new Team("B3", "u15", tournament);
        Team c1 = new Team("C1", "u15", tournament);
        Team c2 = new Team("C2", "u15", tournament);
        Team c3 = new Team("C3", "u15", tournament);

        List<Match> allMatches = new ArrayList<>();
        allMatches.addAll(finishedGroupStageWithOneQualifierPerGroup(tournament, "Groupe A", a1, a2, a3));
        allMatches.addAll(finishedGroupStageWithOneQualifierPerGroup(tournament, "Groupe B", b1, b2, b3));
        allMatches.addAll(finishedGroupStageWithOneQualifierPerGroup(tournament, "Groupe C", c1, c2, c3));
        // Seeded qualifiers are [A1, B1, C1]; SingleEliminationGenerator pairs the first 2
        // (byeCount=1 for 3 participants) so round 1 is A1 vs B1, with C1 as the bye.
        allMatches.add(finished(tournament, "Demi-finales", a1, b1, 2, 1));

        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(matchRepository.findByTournamentIdOrderByDateAsc(10L)).thenReturn(allMatches);
        when(matchRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        BracketAdvanceResponse response = service.advance(10L, 1L);

        assertThat(response.tournamentComplete()).isFalse();
        assertThat(response.matches()).hasSize(1);
        MatchResponse finalMatch = response.matches().get(0);
        assertThat(finalMatch.phase()).isEqualTo("Finale");
        // Winner of the semifinal (A1) plus the carried-over bye (C1) — never an eliminated
        // group-stage team (A2, A3, B2, B3, C2, C3) and never the semifinal loser (B1).
        assertThat(List.of(finalMatch.homeTeam().name(), finalMatch.awayTeam().name()))
                .containsExactlyInAnyOrder("A1", "C1");
    }
}
