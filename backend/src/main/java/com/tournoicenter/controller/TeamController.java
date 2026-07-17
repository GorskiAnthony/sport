package com.tournoicenter.controller;

import com.tournoicenter.dto.ApiResponse;
import com.tournoicenter.dto.team.FollowedTeamResponse;
import com.tournoicenter.dto.team.TeamRequest;
import com.tournoicenter.dto.team.TeamResponse;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.service.TeamFollowService;
import com.tournoicenter.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;
    private final TeamFollowService teamFollowService;

    public TeamController(TeamService teamService, TeamFollowService teamFollowService) {
        this.teamService = teamService;
        this.teamFollowService = teamFollowService;
    }

    @GetMapping("/followed")
    public ApiResponse<List<TeamResponse>> findFollowed(@AuthenticationPrincipal JwtPrincipal principal) {
        return ApiResponse.of(teamFollowService.findFollowed(principal.userId()));
    }

    @GetMapping("/followed/enriched")
    public ApiResponse<List<FollowedTeamResponse>> findFollowedEnriched(@AuthenticationPrincipal JwtPrincipal principal) {
        return ApiResponse.of(teamFollowService.findFollowedEnriched(principal.userId()));
    }

    @GetMapping("/{id}/follow")
    public ApiResponse<Map<String, Boolean>> isFollowing(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        return ApiResponse.of(teamFollowService.isFollowing(principal.userId(), id));
    }

    @PostMapping("/{id}/follow")
    public ApiResponse<Map<String, Boolean>> follow(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        teamFollowService.follow(principal.userId(), id);
        return ApiResponse.of(Map.of("following", true));
    }

    @DeleteMapping("/{id}/follow")
    public ApiResponse<Map<String, Boolean>> unfollow(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        teamFollowService.unfollow(principal.userId(), id);
        return ApiResponse.of(Map.of("following", false));
    }

    @GetMapping("/tournament/{tournamentId}")
    public ApiResponse<List<TeamResponse>> findByTournament(@PathVariable Long tournamentId) {
        return ApiResponse.of(teamService.findByTournament(tournamentId));
    }

    @GetMapping("/{id}")
    public ApiResponse<TeamResponse> findById(@PathVariable Long id) {
        return ApiResponse.of(teamService.findById(id));
    }

    @PostMapping
    public ApiResponse<TeamResponse> create(@AuthenticationPrincipal JwtPrincipal principal,
                                             @Valid @RequestBody TeamRequest request) {
        return ApiResponse.of(teamService.create(principal.userId(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<TeamResponse> update(@AuthenticationPrincipal JwtPrincipal principal,
                                             @PathVariable Long id,
                                             @RequestBody TeamRequest request) {
        return ApiResponse.of(teamService.update(id, principal.userId(), request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Boolean>> delete(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        teamService.delete(id, principal.userId());
        return ApiResponse.of(Map.of("success", true));
    }
}
