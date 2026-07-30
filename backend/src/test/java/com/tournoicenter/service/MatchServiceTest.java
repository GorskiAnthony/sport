package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.dto.match.MatchScoreRequest;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import com.tournoicenter.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchServiceTest {

    @Mock
    private MatchRepository matchRepository;
    @Mock
    private TournamentRepository tournamentRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private TournamentLiveService tournamentLiveService;
    @Mock
    private CacheManager cacheManager;

    private MatchService service;

    @BeforeEach
    void setUp() {
        service = new MatchService(matchRepository, tournamentRepository, teamRepository, userRepository,
                notificationService, tournamentLiveService, cacheManager);
    }

    private User user(Long id, Role role) {
        User user = new User("user" + id + "@example.com", "hash", "User " + id, role);
        setId(user, id);
        return user;
    }

    private Tournament tournament(User organizer) {
        Tournament tournament = new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5), 14, organizer);
        setId(tournament, 100L);
        return tournament;
    }

    private Match match(Tournament tournament) {
        Team home = new Team("Domicile", "u15", tournament);
        Team away = new Team("Extérieur", "u15", tournament);
        Match match = new Match(tournament, home, away, "Poule A", Instant.parse("2026-08-01T10:00:00Z"));
        setId(match, 1L);
        return match;
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
    void findAssignedToRefereeMapsRepositoryResults() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        when(matchRepository.findByRefereeIdOrderByDateAsc(9L)).thenReturn(List.of(match));

        List<MatchResponse> result = service.findAssignedToReferee(9L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(match.getId());
    }

    @Test
    void organizerCanAssignARefereeToTheirMatch() {
        User organizer = user(1L, Role.ORGANIZER);
        User referee = user(9L, Role.REFEREE);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
        when(userRepository.findById(9L)).thenReturn(Optional.of(referee));

        MatchResponse response = service.assignReferee(1L, 1L, 9L);

        assertThat(response.refereeId()).isEqualTo(9L);
    }

    @Test
    void assigningRefereeRejectsAUserWithoutTheRefereeRole() {
        User organizer = user(1L, Role.ORGANIZER);
        User spectator = user(9L, Role.SPECTATOR);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
        when(userRepository.findById(9L)).thenReturn(Optional.of(spectator));

        assertThatThrownBy(() -> service.assignReferee(1L, 1L, 9L)).isInstanceOf(ApiException.class);
    }

    @Test
    void assigningRefereeIsForbiddenToNonOrganizers() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.assignReferee(1L, 2L, 9L)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void assigningNullRefereeIdUnassignsTheReferee() {
        User organizer = user(1L, Role.ORGANIZER);
        User referee = user(9L, Role.REFEREE);
        Match match = match(tournament(organizer));
        match.setReferee(referee);
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        MatchResponse response = service.assignReferee(1L, 1L, null);

        assertThat(response.refereeId()).isNull();
    }

    @Test
    void assignedRefereeCanUpdateTheScore() {
        User organizer = user(1L, Role.ORGANIZER);
        User referee = user(9L, Role.REFEREE);
        Match match = match(tournament(organizer));
        match.setReferee(referee);
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        MatchResponse response = service.updateScore(1L, 9L, new MatchScoreRequest(3, 1, null, null));

        assertThat(response.homeScore()).isEqualTo(3);
        assertThat(response.awayScore()).isEqualTo(1);
    }

    @Test
    void updateScoreIsForbiddenToAReferereNotAssignedToTheMatch() {
        User organizer = user(1L, Role.ORGANIZER);
        User otherReferee = user(42L, Role.REFEREE);
        Match match = match(tournament(organizer));
        match.setReferee(otherReferee);
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.updateScore(1L, 9L, new MatchScoreRequest(3, 1, null, null)))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void assignedRefereeCanStartTheMatch() {
        User organizer = user(1L, Role.ORGANIZER);
        User referee = user(9L, Role.REFEREE);
        Match match = match(tournament(organizer));
        match.setReferee(referee);
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        MatchResponse response = service.start(1L, 9L);

        assertThat(response.status().name()).isEqualTo("ONGOING");
    }

    @Test
    void assignedRefereeCannotRecordAForfeit() {
        User organizer = user(1L, Role.ORGANIZER);
        User referee = user(9L, Role.REFEREE);
        Match match = match(tournament(organizer));
        match.setReferee(referee);
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.recordForfeit(1L, 9L, match.getHomeTeam().getId()))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void assignedRefereeCannotDeleteTheMatch() {
        User organizer = user(1L, Role.ORGANIZER);
        User referee = user(9L, Role.REFEREE);
        Match match = match(tournament(organizer));
        match.setReferee(referee);
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.delete(1L, 9L)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void assigningRefereeToAMissingMatchThrowsNotFound() {
        when(matchRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignReferee(1L, 1L, 9L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
