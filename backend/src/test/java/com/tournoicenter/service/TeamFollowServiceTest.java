package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.TeamFollow;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentStatus;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.team.FollowedTeamResponse;
import com.tournoicenter.dto.team.TeamResponse;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamFollowRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamFollowServiceTest {

    @Mock
    private TeamFollowRepository teamFollowRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MatchRepository matchRepository;

    private TeamFollowService service;

    @BeforeEach
    void setUp() {
        service = new TeamFollowService(teamFollowRepository, teamRepository, userRepository, matchRepository);
    }

    private Tournament tournament() {
        Tournament tournament = new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5), 14, null);
        tournament.setStatus(TournamentStatus.ONGOING);
        return tournament;
    }

    private Team team() {
        return new Team("Team A", "u15", tournament());
    }

    @Test
    void followSkipsWhenAlreadyFollowing() {
        when(teamFollowRepository.existsByUserIdAndTeamId(1L, 10L)).thenReturn(true);

        service.follow(1L, 10L);

        verify(teamFollowRepository, never()).save(any());
    }

    @Test
    void followSavesNewFollowWhenTeamExists() {
        when(teamFollowRepository.existsByUserIdAndTeamId(1L, 10L)).thenReturn(false);
        when(teamRepository.findById(10L)).thenReturn(Optional.of(team()));
        User user = new User("spectator@example.com", "hash", "Spectateur", Role.SPECTATOR);
        when(userRepository.getReferenceById(1L)).thenReturn(user);

        service.follow(1L, 10L);

        verify(teamFollowRepository).save(any(com.tournoicenter.domain.TeamFollow.class));
    }

    @Test
    void followRejectsUnknownTeam() {
        when(teamFollowRepository.existsByUserIdAndTeamId(1L, 10L)).thenReturn(false);
        when(teamRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.follow(1L, 10L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void unfollowDeletesExistingFollow() {
        TeamFollow follow = mock(TeamFollow.class);
        when(teamFollowRepository.findByUserIdAndTeamId(1L, 10L)).thenReturn(Optional.of(follow));

        service.unfollow(1L, 10L);

        verify(teamFollowRepository).delete(follow);
    }

    @Test
    void isFollowingReflectsRepository() {
        when(teamFollowRepository.existsByUserIdAndTeamId(1L, 10L)).thenReturn(true);

        assertThat(service.isFollowing(1L, 10L)).containsEntry("following", true);
    }

    @Test
    void findFollowedMapsToBareTeamResponses() {
        TeamFollow follow = new TeamFollow(new User("s@example.com", "hash", "S", Role.SPECTATOR), team());
        when(teamFollowRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(follow));

        List<TeamResponse> result = service.findFollowed(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Team A");
    }

    @Test
    void findFollowedEnrichedPopulatesNextMatchWhenOneIsScheduled() {
        Team team = team();
        TeamFollow follow = new TeamFollow(new User("s@example.com", "hash", "S", Role.SPECTATOR), team);
        when(teamFollowRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(follow));

        Match scheduled = new Match(team.getTournament(), team, team, "Poule unique", Instant.now());
        when(matchRepository.findByTeamIdAndStatusOrderByDateAsc(any(), eq(MatchStatus.SCHEDULED), any()))
                .thenReturn(List.of(scheduled));
        when(matchRepository.findByTeamIdAndStatusOrderByDateDesc(any(), eq(MatchStatus.FINISHED), any()))
                .thenReturn(List.of());

        List<FollowedTeamResponse> result = service.findFollowedEnriched(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nextMatch()).isNotNull();
        assertThat(result.get(0).lastMatch()).isNull();
        assertThat(result.get(0).tournamentName()).isEqualTo("Cup");
        assertThat(result.get(0).tournamentStatus()).isEqualTo(TournamentStatus.ONGOING);
    }

    @Test
    void findFollowedEnrichedPopulatesLastMatchWhenOnlyAFinishedOneExists() {
        Team team = team();
        TeamFollow follow = new TeamFollow(new User("s@example.com", "hash", "S", Role.SPECTATOR), team);
        when(teamFollowRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(follow));

        Match finished = new Match(team.getTournament(), team, team, "Poule unique", Instant.now());
        when(matchRepository.findByTeamIdAndStatusOrderByDateAsc(any(), eq(MatchStatus.SCHEDULED), any()))
                .thenReturn(List.of());
        when(matchRepository.findByTeamIdAndStatusOrderByDateDesc(any(), eq(MatchStatus.FINISHED), any()))
                .thenReturn(List.of(finished));

        List<FollowedTeamResponse> result = service.findFollowedEnriched(1L);

        assertThat(result.get(0).nextMatch()).isNull();
        assertThat(result.get(0).lastMatch()).isNotNull();
    }

    @Test
    void findFollowedEnrichedLeavesBothNullWhenTeamHasNoMatches() {
        Team team = team();
        TeamFollow follow = new TeamFollow(new User("s@example.com", "hash", "S", Role.SPECTATOR), team);
        when(teamFollowRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(follow));
        when(matchRepository.findByTeamIdAndStatusOrderByDateAsc(any(), any(), any())).thenReturn(List.of());
        when(matchRepository.findByTeamIdAndStatusOrderByDateDesc(any(), any(), any())).thenReturn(List.of());

        List<FollowedTeamResponse> result = service.findFollowedEnriched(1L);

        assertThat(result.get(0).nextMatch()).isNull();
        assertThat(result.get(0).lastMatch()).isNull();
    }
}
