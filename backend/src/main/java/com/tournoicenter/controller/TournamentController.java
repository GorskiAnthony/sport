package com.tournoicenter.controller;

import com.tournoicenter.dto.ApiResponse;
import com.tournoicenter.dto.tournament.RecentTournamentResponse;
import com.tournoicenter.dto.tournament.TournamentDetailResponse;
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
}
