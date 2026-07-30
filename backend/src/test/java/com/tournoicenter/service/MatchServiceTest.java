package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.dto.match.MatchScoreRequest;
import com.tournoicenter.dto.match.TeamSide;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    private NotificationService notificationService;
    @Mock
    private TournamentLiveService tournamentLiveService;
    @Mock
    private CacheManager cacheManager;

    private MatchService service;

    @BeforeEach
    void setUp() {
        service = new MatchService(matchRepository, tournamentRepository, teamRepository,
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
        tournament.setRefereeJoinToken("current-join-token");
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

    // --- UserActor (organizer) ---

    @Test
    void organizerCanUpdateTheScore() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        MatchResponse response = service.updateScore(1L, new MatchActor.UserActor(1L), new MatchScoreRequest(3, 1, null, null));

        assertThat(response.homeScore()).isEqualTo(3);
        assertThat(response.awayScore()).isEqualTo(1);
    }

    @Test
    void nonOrganizerUserIsForbiddenToUpdateTheScore() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.updateScore(1L, new MatchActor.UserActor(2L), new MatchScoreRequest(3, 1, null, null)))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void organizerCanStartTheMatch() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        MatchResponse response = service.start(1L, new MatchActor.UserActor(1L));

        assertThat(response.status()).isEqualTo(MatchStatus.ONGOING);
    }

    // --- TournamentSessionActor (QR-joined referee) ---

    @Test
    void tournamentSessionCanManageAMatchInItsOwnTournament() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        MatchResponse response = service.start(1L, new MatchActor.TournamentSessionActor(100L, "current-join-token"));

        assertThat(response.status()).isEqualTo(MatchStatus.ONGOING);
    }

    @Test
    void tournamentSessionForADifferentTournamentIsForbidden() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.start(1L, new MatchActor.TournamentSessionActor(999L, "current-join-token")))
                .isInstanceOf(ForbiddenException.class);
    }

    /** The organizer regenerated the QR code (TournamentService.regenerateRefereeJoinToken) —
     *  a session minted from the old token must stop working immediately, not just block new
     *  joins. See MatchService.requireCanManage. */
    @Test
    void tournamentSessionWithAStaleJoinTokenIsForbidden() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.start(1L, new MatchActor.TournamentSessionActor(100L, "old-regenerated-away-token")))
                .isInstanceOf(ForbiddenException.class);
    }

    // --- recordGoal ---

    @Test
    void recordGoalIncrementsTheHomeScoreWhileOngoing() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        match.setStatus(MatchStatus.ONGOING);
        match.setHomeScore(1);
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
        when(matchRepository.incrementHomeScore(1L, 1)).thenAnswer(invocation -> {
            match.setHomeScore(match.getHomeScore() + 1);
            return 1;
        });

        MatchResponse response = service.recordGoal(1L, new MatchActor.UserActor(1L), TeamSide.HOME, 1);

        assertThat(response.homeScore()).isEqualTo(2);
        assertThat(response.status()).isEqualTo(MatchStatus.ONGOING);
    }

    @Test
    void recordGoalRejectsAMatchThatHasNotStarted() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        match.setStatus(MatchStatus.SCHEDULED);
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.recordGoal(1L, new MatchActor.UserActor(1L), TeamSide.HOME, 1))
                .isInstanceOf(ApiException.class);
    }

    /** The match finished (or was forfeited) between the status check and the atomic UPDATE —
     *  incrementHomeScore's WHERE status = 'ONGOING' guard means 0 rows change. */
    @Test
    void recordGoalRejectsWhenTheMatchFinishesConcurrently() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        match.setStatus(MatchStatus.ONGOING);
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
        when(matchRepository.incrementAwayScore(1L, 1)).thenReturn(0);

        assertThatThrownBy(() -> service.recordGoal(1L, new MatchActor.UserActor(1L), TeamSide.AWAY, 1))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void recordGoalIsForbiddenForATournamentSessionFromAnotherTournament() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        match.setStatus(MatchStatus.ONGOING);
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.recordGoal(1L, new MatchActor.TournamentSessionActor(999L, "current-join-token"), TeamSide.HOME, 1))
                .isInstanceOf(ForbiddenException.class);
    }

    // --- organizer-only actions, unchanged ---

    @Test
    void nonOrganizerCannotRecordAForfeit() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.recordForfeit(1L, 2L, match.getHomeTeam().getId()))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void nonOrganizerCannotDeleteTheMatch() {
        User organizer = user(1L, Role.ORGANIZER);
        Match match = match(tournament(organizer));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.delete(1L, 2L)).isInstanceOf(ForbiddenException.class);
    }
}
