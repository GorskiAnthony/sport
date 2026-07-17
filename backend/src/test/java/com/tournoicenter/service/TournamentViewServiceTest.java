package com.tournoicenter.service;

import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentView;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.tournament.RecentTournamentResponse;
import com.tournoicenter.repository.TournamentRepository;
import com.tournoicenter.repository.TournamentViewRepository;
import com.tournoicenter.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TournamentViewServiceTest {

    @Mock
    private TournamentViewRepository tournamentViewRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TournamentRepository tournamentRepository;

    private TournamentViewService service;

    @BeforeEach
    void setUp() {
        service = new TournamentViewService(tournamentViewRepository, userRepository, tournamentRepository);
    }

    private User user() {
        return new User("spectator@example.com", "hash", "Spectateur", Role.SPECTATOR);
    }

    private Tournament tournament() {
        User organizer = mock(User.class);
        lenient().when(organizer.getId()).thenReturn(99L);
        return new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5), 14, organizer);
    }

    @Test
    void firstViewSavesNewRow() {
        User user = user();
        Tournament tournament = tournament();
        when(tournamentViewRepository.findByUserIdAndTournamentId(1L, 10L)).thenReturn(Optional.empty());
        when(userRepository.getReferenceById(1L)).thenReturn(user);
        when(tournamentRepository.getReferenceById(10L)).thenReturn(tournament);

        service.recordView(1L, 10L);

        verify(tournamentViewRepository).save(any(TournamentView.class));
    }

    @Test
    void repeatViewTouchesExistingRowInsteadOfSavingANewOne() {
        TournamentView existing = mock(TournamentView.class);
        when(tournamentViewRepository.findByUserIdAndTournamentId(1L, 10L)).thenReturn(Optional.of(existing));

        service.recordView(1L, 10L);

        verify(existing).touch();
        verify(tournamentViewRepository, never()).save(any());
    }

    @Test
    void findRecentlyViewedMapsEntitiesToResponses() {
        TournamentView view = new TournamentView(user(), tournament());
        when(tournamentViewRepository.findTop10ByUserIdOrderByLastViewedAtDesc(1L)).thenReturn(List.of(view));

        List<RecentTournamentResponse> result = service.findRecentlyViewed(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).tournament().name()).isEqualTo("Cup");
        assertThat(result.get(0).firstViewedAt()).isNull(); // @CreationTimestamp only populated by Hibernate on persist
        assertThat(result.get(0).lastViewedAt()).isNotNull();
    }
}
