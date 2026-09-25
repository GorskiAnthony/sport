package com.matchday.controller;

import com.matchday.dto.ApiResponse;
import com.matchday.dto.tournament.RecentTournamentResponse;
import com.matchday.dto.tournament.RefereeJoinInfoResponse;
import com.matchday.dto.tournament.TournamentDetailResponse;
import com.matchday.dto.tournament.TournamentJoinRequest;
import com.matchday.dto.tournament.TournamentJoinResponse;
import com.matchday.dto.tournament.TournamentRequest;
import com.matchday.dto.tournament.TournamentSummaryResponse;
import com.matchday.security.AuthCookieService;
import com.matchday.security.JwtPrincipal;
import com.matchday.security.JwtService;
import com.matchday.service.TournamentService;
import com.matchday.service.TournamentViewService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentController {

    private final TournamentService tournamentService;
    private final TournamentViewService tournamentViewService;
    private final AuthCookieService authCookieService;
    private final JwtService jwtService;

    public TournamentController(TournamentService tournamentService, TournamentViewService tournamentViewService,
                                 AuthCookieService authCookieService, JwtService jwtService) {
        this.tournamentService = tournamentService;
        this.tournamentViewService = tournamentViewService;
        this.authCookieService = authCookieService;
        this.jwtService = jwtService;
    }

    /** page/size/sport are opt-in: home/sports pages that need every tournament to compute
     *  aggregate figures keep calling this with none of them and get the legacy unpaginated
     *  array. The /tournaments list UI passes them and gets a page back, with the total count
     *  carried in X-Total-Count (see CorsConfigurationSource) rather than changing the JSON
     *  shape — so both callers hit the same endpoint without a dual response contract. */
    @GetMapping
    public ApiResponse<List<TournamentSummaryResponse>> findAll(@RequestParam(required = false) String search,
                                                                  @RequestParam(required = false) String sport,
                                                                  @RequestParam(required = false) Integer page,
                                                                  @RequestParam(required = false) Integer size,
                                                                  HttpServletResponse response) {
        if (page == null && size == null && sport == null) {
            return ApiResponse.of(tournamentService.findAll(search));
        }
        Page<TournamentSummaryResponse> paged = tournamentService.findAllPaged(
                search, sport, page == null ? 0 : page, size == null ? 25 : size);
        response.setHeader("X-Total-Count", String.valueOf(paged.getTotalElements()));
        return ApiResponse.of(paged.getContent());
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

    /** Public — le token du QR code est lui-même le justificatif d'accès, voir SecurityConfig.
     *  Le corps garde sessionToken pour le natif (Bearer, inchangé) ; le même cookie httpOnly
     *  que AuthController.login/register est posé ici pour le build web mobile — voir
     *  JwtAuthenticationFilter, qui retente parseRefereeSessionToken sur la valeur du cookie. */
    @PostMapping("/join")
    public ApiResponse<TournamentJoinResponse> joinAsReferee(@Valid @RequestBody TournamentJoinRequest request,
                                                               HttpServletResponse response) {
        TournamentJoinResponse body = tournamentService.joinAsReferee(request.token(), request.refereeName());
        response.addHeader(HttpHeaders.SET_COOKIE,
                authCookieService.build(body.sessionToken(), jwtService.refereeSessionTtl()).toString());
        return ApiResponse.of(body);
    }
}
