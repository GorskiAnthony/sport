package com.tournoicenter.controller;

import com.tournoicenter.dto.ApiResponse;
import com.tournoicenter.dto.bracket.BracketAdvanceResponse;
import com.tournoicenter.dto.bracket.BracketGenerationRequest;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.service.BracketGenerationService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}/bracket")
public class BracketController {

    private final BracketGenerationService bracketGenerationService;

    public BracketController(BracketGenerationService bracketGenerationService) {
        this.bracketGenerationService = bracketGenerationService;
    }

    @PostMapping
    public ApiResponse<List<MatchResponse>> generate(@AuthenticationPrincipal JwtPrincipal principal,
                                                       @PathVariable Long tournamentId,
                                                       @Valid @RequestBody BracketGenerationRequest request) {
        return ApiResponse.of(bracketGenerationService.generate(tournamentId, principal.userId(), request.format()));
    }

    @PostMapping("/advance")
    public ApiResponse<BracketAdvanceResponse> advance(@AuthenticationPrincipal JwtPrincipal principal,
                                                         @PathVariable Long tournamentId) {
        return ApiResponse.of(bracketGenerationService.advance(tournamentId, principal.userId()));
    }
}
