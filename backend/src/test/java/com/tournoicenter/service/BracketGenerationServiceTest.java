package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import com.tournoicenter.service.bracket.RoundRobinGenerator;
import com.tournoicenter.service.bracket.SingleEliminationGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
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
                List.of(new RoundRobinGenerator(), new SingleEliminationGenerator()),
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
}
