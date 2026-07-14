package com.tournoicenter.controller;

import com.tournoicenter.dto.ApiResponse;
import com.tournoicenter.dto.tournament.TournamentDetailResponse;
import com.tournoicenter.dto.tournament.TournamentRequest;
import com.tournoicenter.dto.tournament.TournamentSummaryResponse;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.service.TournamentService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentController {

    private final TournamentService tournamentService;

    public TournamentController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

    @GetMapping
    public ApiResponse<List<TournamentSummaryResponse>> findAll() {
        return ApiResponse.of(tournamentService.findAll());
    }

    @GetMapping("/me")
    public ApiResponse<List<TournamentSummaryResponse>> findMine(@AuthenticationPrincipal JwtPrincipal principal) {
        return ApiResponse.of(tournamentService.findMine(principal.userId()));
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
}
