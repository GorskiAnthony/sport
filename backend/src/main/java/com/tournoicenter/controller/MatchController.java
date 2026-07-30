package com.tournoicenter.controller;

import com.tournoicenter.dto.ApiResponse;
import com.tournoicenter.dto.match.MatchForfeitRequest;
import com.tournoicenter.dto.match.MatchGoalRequest;
import com.tournoicenter.dto.match.MatchRequest;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.dto.match.MatchScoreRequest;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.security.RefereeSessionPrincipal;
import com.tournoicenter.service.MatchActor;
import com.tournoicenter.service.MatchService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
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

    /** Organisateur OU session de tournoi (QR code) — voir MatchService.requireCanManage. */
    @PatchMapping("/{id}/score")
    public ApiResponse<MatchResponse> updateScore(Authentication authentication,
                                                   @PathVariable Long id,
                                                   @Valid @RequestBody MatchScoreRequest request) {
        return ApiResponse.of(matchService.updateScore(id, resolveActor(authentication), request));
    }

    /** Un but à la fois, envoyé immédiatement — voir MatchService.recordGoal. Mêmes droits que
     *  updateScore/start (organisateur ou session de tournoi). */
    @PatchMapping("/{id}/goal")
    public ApiResponse<MatchResponse> recordGoal(Authentication authentication,
                                                  @PathVariable Long id,
                                                  @Valid @RequestBody MatchGoalRequest request) {
        return ApiResponse.of(matchService.recordGoal(id, resolveActor(authentication), request.team(), request.delta()));
    }

    @PatchMapping("/{id}/forfeit")
    public ApiResponse<MatchResponse> recordForfeit(@AuthenticationPrincipal JwtPrincipal principal,
                                                      @PathVariable Long id,
                                                      @Valid @RequestBody MatchForfeitRequest request) {
        return ApiResponse.of(matchService.recordForfeit(id, principal.userId(), request.teamId()));
    }

    /** Organisateur OU session de tournoi (QR code) — voir MatchService.requireCanManage. */
    @PatchMapping("/{id}/start")
    public ApiResponse<MatchResponse> start(Authentication authentication, @PathVariable Long id) {
        return ApiResponse.of(matchService.start(id, resolveActor(authentication)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Boolean>> delete(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        matchService.delete(id, principal.userId());
        return ApiResponse.of(Map.of("success", true));
    }

    /** Les deux seuls types de principal que JwtAuthenticationFilter authentifie (voir
     *  SecurityConfig — le catch-all final exclut explicitement ROLE_TOURNAMENT_REFEREE_SESSION
     *  de tout le reste de l'API, donc les endpoints qui n'appellent pas ceci ne peuvent jamais
     *  recevoir un RefereeSessionPrincipal). */
    private MatchActor resolveActor(Authentication authentication) {
        return switch (authentication.getPrincipal()) {
            case JwtPrincipal p -> new MatchActor.UserActor(p.userId());
            case RefereeSessionPrincipal s -> new MatchActor.TournamentSessionActor(s.tournamentId(), s.joinToken());
            default -> throw new IllegalStateException("Type de principal inattendu : " + authentication.getPrincipal());
        };
    }
}
