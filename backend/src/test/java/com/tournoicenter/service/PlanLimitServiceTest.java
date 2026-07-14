package com.tournoicenter.service;

import com.tournoicenter.domain.Plan;
import com.tournoicenter.exception.PlanLimitExceededException;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlanLimitServiceTest {

    @Mock
    private TournamentRepository tournamentRepository;

    @Mock
    private TeamRepository teamRepository;

    private PlanLimitService planLimitService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        planLimitService = new PlanLimitService(tournamentRepository, teamRepository);
    }

    @Test
    void freePlanRejectsSecondTournament() {
        when(tournamentRepository.countByOrganizerId(1L)).thenReturn(1L);

        assertThatThrownBy(() -> planLimitService.checkTournamentLimit(1L, Plan.FREE))
                .isInstanceOf(PlanLimitExceededException.class)
                .hasMessageContaining("1 tournoi");
    }

    @Test
    void freePlanAllowsFirstTournament() {
        when(tournamentRepository.countByOrganizerId(1L)).thenReturn(0L);

        assertThatCode(() -> planLimitService.checkTournamentLimit(1L, Plan.FREE)).doesNotThrowAnyException();
    }

    @Test
    void classicPlanHasUnlimitedTournaments() {
        assertThatCode(() -> planLimitService.checkTournamentLimit(1L, Plan.CLASSIC)).doesNotThrowAnyException();
    }

    @Test
    void freePlanRejectsTeamBeyondFourteen() {
        when(teamRepository.countByTournamentId(10L)).thenReturn(14L);

        assertThatThrownBy(() -> planLimitService.checkTeamLimit(10L, Plan.FREE))
                .isInstanceOf(PlanLimitExceededException.class)
                .hasMessageContaining("14 équipe");
    }
}
