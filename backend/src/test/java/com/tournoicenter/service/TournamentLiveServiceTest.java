package com.tournoicenter.service;

import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.User;
import com.tournoicenter.repository.TournamentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TournamentLiveServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private TournamentRepository tournamentRepository;

    private TournamentLiveService service;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        service = new TournamentLiveService(messagingTemplate, tournamentRepository);
    }

    private Tournament tournamentOwnedBy(Plan plan) {
        User organizer = new User("organizer@example.com", "hash", "Organisateur", Role.ORGANIZER);
        organizer.setPlan(plan);
        return new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 3), 14, organizer);
    }

    @Test
    void pushesUpdateForClassicPlanTournament() {
        when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournamentOwnedBy(Plan.CLASSIC)));

        service.notifyTournamentChanged(1L);

        verify(messagingTemplate).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void pushesUpdateForProPlanTournament() {
        when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournamentOwnedBy(Plan.PRO)));

        service.notifyTournamentChanged(1L);

        verify(messagingTemplate).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void doesNotPushUpdateForFreePlanTournament() {
        when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournamentOwnedBy(Plan.FREE)));

        service.notifyTournamentChanged(1L);

        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void doesNotPushUpdateWhenTournamentIsMissing() {
        when(tournamentRepository.findById(1L)).thenReturn(Optional.empty());

        service.notifyTournamentChanged(1L);

        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }
}
