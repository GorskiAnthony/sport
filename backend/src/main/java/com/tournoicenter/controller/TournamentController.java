package com.tournoicenter.controller;

import com.tournoicenter.dto.ApiResponse;
import com.tournoicenter.dto.tournament.RecentTournamentResponse;
import com.tournoicenter.dto.tournament.RefereeJoinInfoResponse;
import com.tournoicenter.dto.tournament.TournamentDetailResponse;
import com.tournoicenter.dto.tournament.TournamentJoinRequest;
import com.tournoicenter.dto.tournament.TournamentJoinResponse;
import com.tournoicenter.dto.tournament.TournamentRequest;
import com.tournoicenter.dto.tournament.TournamentSummaryResponse;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.service.TournamentService;
import com.tournoicenter.service.TournamentViewService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentController {

    private final TournamentService tournamentService;
    private final TournamentViewService tournamentViewService;

    public TournamentController(TournamentService tournamentService, TournamentViewService tournamentViewService) {
        this.tournamentService = tournamentService;
        this.tournamentViewService = tournamentViewService;
    }

    @GetMapping
    public ApiResponse<List<TournamentSummaryResponse>> findAll() {
        return ApiResponse.of(tournamentService.findAll());
    }

    @GetMapping("/me")
    public ApiResponse<List<TournamentSummaryResponse>> findMine(@AuthenticationPrincipal JwtPrincipal principal) {
        return ApiResponse.of(tournamentService.findMine(principal.userId()));
    }

    @GetMapping("/recent")
    public ApiResponse<List<RecentTournamentResponse>> findRecentlyViewed(@AuthenticationPrincipal JwtPrincipal principal) {
        return ApiResponse.of(tournamentViewService.findRecentlyViewed(principal.userId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<TournamentDetailResponse> findById(@PathVariable Long id) {
        return ApiResponse.of(tournamentService.findById(id));
    }

    @PostMapping
    public ApiResponse<TournamentSummaryResponse> create(@AuthenticationPrincipal JwtPrincipal principal,
                                                           @Valid @RequestBody TournamentRequest request) {
        return ApiResponse.of(tournamentService.create(principal.userId(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<TournamentSummaryResponse> update(@AuthenticationPrincipal JwtPrincipal principal,
                                                           @PathVariable Long id,
                                                           @RequestBody TournamentRequest request) {
        return ApiResponse.of(tournamentService.update(id, principal.userId(), request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Boolean>> delete(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        tournamentService.delete(id, principal.userId());
        return ApiResponse.of(Map.of("success", true));
    }

    @PostMapping("/{id}/view")
    public ApiResponse<Map<String, Boolean>> recordView(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        tournamentViewService.recordView(principal.userId(), id);
        return ApiResponse.of(Map.of("recorded", true));
    }

    /** Deliberately unauthenticated — fired from the public tournament page, which anonymous
     *  spectators can view without an account (see SecurityConfig). */
    @PostMapping("/{id}/sponsor-click")
    public ApiResponse<Map<String, Boolean>> recordSponsorClick(@PathVariable Long id) {
        tournamentService.recordSponsorClick(id);
        return ApiResponse.of(Map.of("recorded", true));
    }

    /** Organisateur uniquement — le token renvoyé est un secret (voir SecurityConfig, carve-out
     *  au-dessus du GET /api/tournaments/** public). */
    @GetMapping("/{id}/referee-token")
    public ApiResponse<RefereeJoinInfoResponse> getRefereeJoinInfo(@AuthenticationPrincipal JwtPrincipal principal,
                                                                     @PathVariable Long id) {
        return ApiResponse.of(tournamentService.getRefereeJoinInfo(id, principal.userId()));
    }

    @PostMapping("/{id}/referee-token/regenerate")
    public ApiResponse<RefereeJoinInfoResponse> regenerateRefereeJoinToken(@AuthenticationPrincipal JwtPrincipal principal,
                                                                             @PathVariable Long id) {
        return ApiResponse.of(tournamentService.regenerateRefereeJoinToken(id, principal.userId()));
    }

    /** Public — le token du QR code est lui-même le justificatif d'accès, voir SecurityConfig. */
    @PostMapping("/join")
    public ApiResponse<TournamentJoinResponse> joinAsReferee(@Valid @RequestBody TournamentJoinRequest request) {
        return ApiResponse.of(tournamentService.joinAsReferee(request.token(), request.refereeName()));
    }
}
