package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.NotificationType;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.dto.match.MatchRequest;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.dto.match.MatchScoreRequest;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MatchService {

    private final MatchRepository matchRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final NotificationService notificationService;
    private final TournamentLiveService tournamentLiveService;
    private final CacheManager cacheManager;

    public MatchService(MatchRepository matchRepository, TournamentRepository tournamentRepository, TeamRepository teamRepository,
                         NotificationService notificationService, TournamentLiveService tournamentLiveService,
                         CacheManager cacheManager) {
        this.matchRepository = matchRepository;
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
        this.notificationService = notificationService;
        this.tournamentLiveService = tournamentLiveService;
        this.cacheManager = cacheManager;
    }

    /** A match's score/status/events are embedded in TournamentService's cached tournament
     *  detail (see application.yml) — without evicting here, whoever just mutated a match
     *  (organizer editing a score, or the live-update "refetch" triggered by this same change)
     *  would see the pre-change cached state for up to CACHE_TTL_SECONDS. Evicting costs at
     *  most one extra DB read for the very next viewer; everyone after that still shares one
     *  fresh cached copy, so this doesn't reintroduce the thundering-herd problem the cache
     *  exists to prevent — it just removes an avoidable staleness window on top of it. */
    private void evictTournamentDetailCache(Long tournamentId) {
        Cache detailCache = cacheManager.getCache("tournamentDetail");
        if (detailCache != null) {
            detailCache.evict(tournamentId);
        }
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> findByTournament(Long tournamentId) {
        return matchRepository.findByTournamentIdOrderByDateAsc(tournamentId).stream().map(MatchResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public MatchResponse findById(Long id) {
        return MatchResponse.from(getOrThrow(id));
    }

    @Transactional
    public MatchResponse create(Long requesterId, MatchRequest request) {
        Tournament tournament = tournamentRepository.findById(request.tournamentId())
                .orElseThrow(() -> new ResourceNotFoundException("Tournoi introuvable."));
        if (!tournament.getOrganizer().getId().equals(requesterId)) {
            throw new ForbiddenException();
        }

        Team homeTeam = teamInTournamentOrThrow(request.homeTeamId(), tournament, "domicile");
        Team awayTeam = teamInTournamentOrThrow(request.awayTeamId(), tournament, "extérieur");

        Match match = new Match(tournament, homeTeam, awayTeam, request.phase(), request.date());
        match.setVenue(request.venue());
        match.setHomeScore(request.homeScore());
        match.setAwayScore(request.awayScore());

        MatchResponse response = MatchResponse.from(matchRepository.save(match));
        evictTournamentDetailCache(tournament.getId());
        return response;
    }

    @Transactional
    public MatchResponse updateScore(Long id, Long requesterId, MatchScoreRequest request) {
        Match match = getOrThrow(id);
        requireOwner(match, requesterId);

        boolean wasFinished = match.getStatus() == MatchStatus.FINISHED;
        match.setHomeScore(request.homeScore());
        match.setAwayScore(request.awayScore());
        match.setStatus(MatchStatus.FINISHED);

        Tournament tournament = match.getTournament();

        boolean touchesFairPlay = request.homeFairPlay() != null || request.awayFairPlay() != null;
        if (touchesFairPlay && !PlanLimits.of(tournament.getOrganizer().getPlan()).fairPlay()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "La note fair-play est réservée au plan Pro.");
        }
        if (request.homeFairPlay() != null) match.setHomeFairPlay(request.homeFairPlay());
        if (request.awayFairPlay() != null) match.setAwayFairPlay(request.awayFairPlay());

        RoundRobinStatusSync.sync(tournament, matchRepository.findByTournamentIdOrderByDateAsc(tournament.getId()));

        if (!wasFinished) {
            String message = String.format("Le match %s vs %s est terminé (%d - %d).",
                    match.getHomeTeam().getName(), match.getAwayTeam().getName(), request.homeScore(), request.awayScore());
            notificationService.notifyFollowers(match.getHomeTeam(), tournament, match, NotificationType.MATCH_FINISHED, message);
            notificationService.notifyFollowers(match.getAwayTeam(), tournament, match, NotificationType.MATCH_FINISHED, message);
        }
        tournamentLiveService.notifyTournamentChanged(tournament.getId());
        evictTournamentDetailCache(tournament.getId());

        return MatchResponse.from(match);
    }

    @Transactional
    public MatchResponse start(Long id, Long requesterId) {
        Match match = getOrThrow(id);
        requireOwner(match, requesterId);

        if (match.getStatus() != MatchStatus.SCHEDULED) {
            return MatchResponse.from(match);
        }
        match.setStatus(MatchStatus.ONGOING);

        Tournament tournament = match.getTournament();
        String message = String.format("Le match %s vs %s vient de commencer.", match.getHomeTeam().getName(), match.getAwayTeam().getName());
        notificationService.notifyFollowers(match.getHomeTeam(), tournament, match, NotificationType.MATCH_STARTED, message);
        notificationService.notifyFollowers(match.getAwayTeam(), tournament, match, NotificationType.MATCH_STARTED, message);
        tournamentLiveService.notifyTournamentChanged(tournament.getId());
        evictTournamentDetailCache(tournament.getId());

        return MatchResponse.from(match);
    }

    @Transactional
    public void delete(Long id, Long requesterId) {
        Match match = getOrThrow(id);
        requireOwner(match, requesterId);
        Long tournamentId = match.getTournament().getId();
        matchRepository.delete(match);
        evictTournamentDetailCache(tournamentId);
    }

    /** Without checking the team's own tournament here, an organizer could create a match in
     *  their own tournament that references another organizer's team by id — the team would
     *  then wrongly show up in a tournament it never joined and start receiving its notifications. */
    private Team teamInTournamentOrThrow(Long teamId, Tournament tournament, String side) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Équipe (" + side + ") introuvable."));
        if (!team.getTournament().getId().equals(tournament.getId())) {
            throw new ResourceNotFoundException("Équipe (" + side + ") introuvable.");
        }
        return team;
    }

    private Match getOrThrow(Long id) {
        return matchRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Match introuvable."));
    }

    private void requireOwner(Match match, Long requesterId) {
        if (!match.getTournament().getOrganizer().getId().equals(requesterId)) {
            throw new ForbiddenException();
        }
    }
}
