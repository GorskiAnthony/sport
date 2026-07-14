package com.tournoicenter.controller;

import com.tournoicenter.dto.ApiResponse;
import com.tournoicenter.dto.match.MatchRequest;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.dto.match.MatchScoreRequest;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.service.MatchService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping("/tournament/{tournamentId}")
    public ApiResponse<List<MatchResponse>> findByTournament(@PathVariable Long tournamentId) {
        return ApiResponse.of(matchService.findByTournament(tournamentId));
    }

    @GetMapping("/{id}")
    public ApiResponse<MatchResponse> findById(@PathVariable Long id) {
        return ApiResponse.of(matchService.findById(id));
    }

    @PostMapping
    public ApiResponse<MatchResponse> create(@AuthenticationPrincipal JwtPrincipal principal,
                                              @Valid @RequestBody MatchRequest request) {
        return ApiResponse.of(matchService.create(principal.userId(), request));
    }

    @PatchMapping("/{id}/score")
    public ApiResponse<MatchResponse> updateScore(@AuthenticationPrincipal JwtPrincipal principal,
                                                   @PathVariable Long id,
                                                   @RequestBody MatchScoreRequest request) {
        return ApiResponse.of(matchService.updateScore(id, principal.userId(), request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Boolean>> delete(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        matchService.delete(id, principal.userId());
        return ApiResponse.of(Map.of("success", true));
    }
}
