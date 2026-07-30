package com.tournoicenter.service;

import com.tournoicenter.config.MobileProperties;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.tournament.RefereeJoinInfoResponse;
import com.tournoicenter.dto.tournament.TournamentJoinResponse;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TournamentRepository;
import com.tournoicenter.repository.UserRepository;
import com.tournoicenter.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TournamentServiceTest {

    @Mock
    private TournamentRepository tournamentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PlanLimitService planLimitService;
    @Mock
    private MatchRepository matchRepository;
    @Mock
    private EventPassService eventPassService;
    @Mock
    private JwtService jwtService;

    private TournamentService service;

    @BeforeEach
    void setUp() {
        service = new TournamentService(tournamentRepository, userRepository, planLimitService, matchRepository,
                eventPassService, jwtService, new MobileProperties("http://localhost:8100"));
    }

    private User organizer(Long id) {
        User user = new User("organizer" + id + "@example.com", "hash", "Organizer " + id, Role.ORGANIZER);
        setId(user, id);
        return user;
    }

    private Tournament tournament(Long id, User organizer, String joinToken) {
        Tournament tournament = new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5), 14, organizer);
        setId(tournament, id);
        tournament.setRefereeJoinToken(joinToken);
        return tournament;
    }

    private static void setId(Object entity, Long id) {
        try {
            var field = entity.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void getRefereeJoinInfoReturnsTheTokenAndAConstructedJoinUrl() {
        User organizer = organizer(1L);
        Tournament tournament = tournament(10L, organizer, "abc123");
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));

        RefereeJoinInfoResponse response = service.getRefereeJoinInfo(10L, 1L);

        assertThat(response.token()).isEqualTo("abc123");
        assertThat(response.joinUrl()).isEqualTo("http://localhost:8100/join/abc123");
    }

    @Test
    void getRefereeJoinInfoIsForbiddenToNonOrganizers() {
        User organizer = organizer(1L);
        Tournament tournament = tournament(10L, organizer, "abc123");
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));

        assertThatThrownBy(() -> service.getRefereeJoinInfo(10L, 2L)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void regenerateRefereeJoinTokenReplacesTheStoredToken() {
        User organizer = organizer(1L);
        Tournament tournament = tournament(10L, organizer, "old-token");
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));

        RefereeJoinInfoResponse response = service.regenerateRefereeJoinToken(10L, 1L);

        assertThat(response.token()).isNotEqualTo("old-token");
        assertThat(tournament.getRefereeJoinToken()).isEqualTo(response.token());
    }

    @Test
    void joinAsRefereeMintsASessionTokenScopedToTheTournament() {
        User organizer = organizer(1L);
        Tournament tournament = tournament(10L, organizer, "abc123");
        when(tournamentRepository.findByRefereeJoinToken("abc123")).thenReturn(Optional.of(tournament));
        when(jwtService.generateRefereeSessionToken(10L, "Jean", "abc123")).thenReturn("session-jwt");

        TournamentJoinResponse response = service.joinAsReferee("abc123", "Jean");

        assertThat(response.sessionToken()).isEqualTo("session-jwt");
        assertThat(response.tournamentId()).isEqualTo(10L);
        assertThat(response.tournamentName()).isEqualTo("Cup");
    }

    @Test
    void joinAsRefereeRejectsAnUnknownToken() {
        when(tournamentRepository.findByRefereeJoinToken("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.joinAsReferee("nope", null)).isInstanceOf(ResourceNotFoundException.class);
    }
}
