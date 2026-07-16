package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.TeamFollow;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.team.FollowedTeamResponse;
import com.tournoicenter.dto.team.TeamResponse;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamFollowRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class TeamFollowService {

    private final TeamFollowRepository teamFollowRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;

    public TeamFollowService(TeamFollowRepository teamFollowRepository, TeamRepository teamRepository,
                              UserRepository userRepository, MatchRepository matchRepository) {
        this.teamFollowRepository = teamFollowRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.matchRepository = matchRepository;
    }

    @Transactional
    public void follow(Long userId, Long teamId) {
        if (teamFollowRepository.existsByUserIdAndTeamId(userId, teamId)) {
            return;
        }
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new ResourceNotFoundException("Équipe introuvable."));
        User user = userRepository.getReferenceById(userId);
        teamFollowRepository.save(new TeamFollow(user, team));
    }

    @Transactional
    public void unfollow(Long userId, Long teamId) {
        teamFollowRepository.findByUserIdAndTeamId(userId, teamId).ifPresent(teamFollowRepository::delete);
    }

    @Transactional(readOnly = true)
    public Map<String, Boolean> isFollowing(Long userId, Long teamId) {
        return Map.of("following", teamFollowRepository.existsByUserIdAndTeamId(userId, teamId));
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> findFollowed(Long userId) {
        return teamFollowRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(follow -> TeamResponse.from(follow.getTeam()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FollowedTeamResponse> findFollowedEnriched(Long userId) {
        return teamFollowRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(follow -> {
                    Team team = follow.getTeam();
                    Match next = firstOrNull(matchRepository.findByTeamIdAndStatusOrderByDateAsc(
                            team.getId(), MatchStatus.SCHEDULED, PageRequest.of(0, 1)));
                    Match last = firstOrNull(matchRepository.findByTeamIdAndStatusOrderByDateDesc(
                            team.getId(), MatchStatus.FINISHED, PageRequest.of(0, 1)));
                    return FollowedTeamResponse.of(team, next, last);
                })
                .toList();
    }

    private static Match firstOrNull(List<Match> matches) {
        return matches.isEmpty() ? null : matches.get(0);
    }
}
