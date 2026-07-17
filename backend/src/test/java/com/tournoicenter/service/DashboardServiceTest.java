package com.tournoicenter.service;

import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.TournamentStatus;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.dashboard.OrganizerDashboardResponse;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import com.tournoicenter.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private TournamentRepository tournamentRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private MatchRepository matchRepository;
    @Mock
    private UserRepository userRepository;

    private DashboardService service;

    @BeforeEach
    void setUp() {
        service = new DashboardService(tournamentRepository, teamRepository, matchRepository, userRepository);
    }

    private User organizerWithPlan(Plan plan) {
        User user = new User("organizer@example.com", "hash", "Organisateur", Role.ORGANIZER);
        user.setPlan(plan);
        return user;
    }

    @Test
    void composesStatsForFreePlanOrganizer() {
        when(tournamentRepository.countByOrganizerId(1L)).thenReturn(1L);
        when(tournamentRepository.countByOrganizerIdAndStatus(1L, TournamentStatus.UPCOMING)).thenReturn(1L);
        when(tournamentRepository.countByOrganizerIdAndStatus(1L, TournamentStatus.ONGOING)).thenReturn(0L);
        when(tournamentRepository.countByOrganizerIdAndStatus(1L, TournamentStatus.FINISHED)).thenReturn(0L);
        when(teamRepository.countByTournamentOrganizerId(1L)).thenReturn(8L);
        when(matchRepository.countByTournamentOrganizerId(1L)).thenReturn(12L);
        when(matchRepository.countByTournamentOrganizerIdAndStatus(1L, MatchStatus.SCHEDULED)).thenReturn(10L);
        when(matchRepository.countByTournamentOrganizerIdAndStatus(1L, MatchStatus.ONGOING)).thenReturn(0L);
        when(matchRepository.countByTournamentOrganizerIdAndStatus(1L, MatchStatus.FINISHED)).thenReturn(2L);
        when(matchRepository.findTop10ByTournamentOrganizerIdAndStatusAndDateBetweenOrderByDateAsc(
                eq(1L), eq(MatchStatus.SCHEDULED), any(), any())).thenReturn(List.of());
        when(userRepository.getReferenceById(1L)).thenReturn(organizerWithPlan(Plan.FREE));

        OrganizerDashboardResponse response = service.getOrganizerStats(1L);

        assertThat(response.tournaments().total()).isEqualTo(1);
        assertThat(response.tournaments().upcoming()).isEqualTo(1);
        assertThat(response.teamsCount()).isEqualTo(8);
        assertThat(response.matches().total()).isEqualTo(12);
        assertThat(response.matches().scheduled()).isEqualTo(10);
        assertThat(response.plan().plan()).isEqualTo(Plan.FREE);
        assertThat(response.plan().maxTournaments()).isEqualTo(1);
        assertThat(response.plan().usedTournaments()).isEqualTo(1);
    }

    @Test
    void classicPlanReflectsUnlimitedTournaments() {
        when(tournamentRepository.countByOrganizerId(2L)).thenReturn(5L);
        when(tournamentRepository.countByOrganizerIdAndStatus(eq(2L), any())).thenReturn(0L);
        when(teamRepository.countByTournamentOrganizerId(2L)).thenReturn(0L);
        when(matchRepository.countByTournamentOrganizerId(2L)).thenReturn(0L);
        when(matchRepository.countByTournamentOrganizerIdAndStatus(eq(2L), any())).thenReturn(0L);
        when(matchRepository.findTop10ByTournamentOrganizerIdAndStatusAndDateBetweenOrderByDateAsc(
                eq(2L), eq(MatchStatus.SCHEDULED), any(), any())).thenReturn(List.of());
        when(userRepository.getReferenceById(2L)).thenReturn(organizerWithPlan(Plan.CLASSIC));

        OrganizerDashboardResponse response = service.getOrganizerStats(2L);

        assertThat(response.plan().maxTournaments()).isEqualTo(Integer.MAX_VALUE);
        assertThat(response.plan().usedTournaments()).isEqualTo(5);
    }

    @Test
    void upcomingMatchesWindowUsesAValidFromBeforeToRange() {
        when(tournamentRepository.countByOrganizerId(1L)).thenReturn(0L);
        when(tournamentRepository.countByOrganizerIdAndStatus(eq(1L), any())).thenReturn(0L);
        when(teamRepository.countByTournamentOrganizerId(1L)).thenReturn(0L);
        when(matchRepository.countByTournamentOrganizerId(1L)).thenReturn(0L);
        when(matchRepository.countByTournamentOrganizerIdAndStatus(eq(1L), any())).thenReturn(0L);
        when(matchRepository.findTop10ByTournamentOrganizerIdAndStatusAndDateBetweenOrderByDateAsc(
                any(), any(), any(), any())).thenReturn(List.of());
        when(userRepository.getReferenceById(1L)).thenReturn(organizerWithPlan(Plan.FREE));

        service.getOrganizerStats(1L);

        ArgumentCaptor<Instant> from = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> to = ArgumentCaptor.forClass(Instant.class);
        org.mockito.Mockito.verify(matchRepository).findTop10ByTournamentOrganizerIdAndStatusAndDateBetweenOrderByDateAsc(
                eq(1L), eq(MatchStatus.SCHEDULED), from.capture(), to.capture());

        assertThat(to.getValue()).isAfter(from.getValue());
    }
}
