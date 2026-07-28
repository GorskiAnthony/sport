package com.tournoicenter.service;

import com.tournoicenter.domain.EventPassPurchase;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.tournament.TournamentDetailResponse;
import com.tournoicenter.dto.tournament.TournamentRequest;
import com.tournoicenter.dto.tournament.TournamentSummaryResponse;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TournamentRepository;
import com.tournoicenter.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final PlanLimitService planLimitService;
    private final MatchRepository matchRepository;
    private final EventPassService eventPassService;

    public TournamentService(TournamentRepository tournamentRepository, UserRepository userRepository,
                              PlanLimitService planLimitService, MatchRepository matchRepository,
                              EventPassService eventPassService) {
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
        this.planLimitService = planLimitService;
        this.matchRepository = matchRepository;
        this.eventPassService = eventPassService;
    }

    /** Cached briefly (see application.yml) — the public tournament list is hit by every
     *  visitor and doesn't need to be millisecond-fresh. */
    @Cacheable("tournamentList")
    @Transactional(readOnly = true)
    public List<TournamentSummaryResponse> findAll() {
        return tournamentRepository.findAllByOrderByStartDateDesc().stream().map(TournamentSummaryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TournamentSummaryResponse> findMine(Long organizerId) {
        return tournamentRepository.findByOrganizerIdOrderByCreatedAtDesc(organizerId).stream()
                .map(TournamentSummaryResponse::from).toList();
    }

    /** Cached briefly (see application.yml) — this is the endpoint a burst of spectators all
     *  hammer simultaneously when watching the same live tournament, so a short TTL matters
     *  more here than anywhere else: it collapses N simultaneous requests for the same
     *  tournament into one DB hit instead of N. Deliberately NOT evicted on match score/goal
     *  updates (see MatchService) — those are exactly what triggers the read burst in the
     *  first place, so evicting eagerly would defeat the point; the short TTL alone bounds
     *  staleness to a couple of seconds, which is an acceptable trade-off for live scores. */
    @Cacheable(value = "tournamentDetail", key = "#id")
    @Transactional
    public TournamentDetailResponse findById(Long id) {
        Tournament tournament = getOrThrow(id);
        RoundRobinStatusSync.sync(tournament, matchRepository.findByTournamentIdOrderByDateAsc(id));
        return TournamentDetailResponse.from(tournament);
    }

    @CacheEvict(value = "tournamentList", allEntries = true)
    @Transactional
    public TournamentSummaryResponse create(Long organizerId, TournamentRequest request) {
        User organizer = userRepository.getReferenceById(organizerId);

        boolean useEventPass = Boolean.TRUE.equals(request.useEventPass());
        EventPassPurchase credit = null;
        if (useEventPass) {
            credit = eventPassService.findAvailableCredit(organizerId)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Aucun Pass Événement disponible."));
        } else {
            planLimitService.checkTournamentLimit(organizerId, organizer.getPlan());
        }

        Tournament tournament = new Tournament(
                request.name(), request.sport(), request.category(), request.location(),
                request.startDate(), request.endDate(),
                request.maxTeams() != null ? request.maxTeams() : 14,
                organizer
        );
        applyOptionalFields(tournament, request);

        Tournament saved = tournamentRepository.save(tournament);

        if (credit != null) {
            eventPassService.consumeCredit(credit, saved);
        }

        return TournamentSummaryResponse.from(saved);
    }

    @Caching(evict = {
            @CacheEvict(value = "tournamentList", allEntries = true),
            @CacheEvict(value = "tournamentDetail", key = "#id")
    })
    @Transactional
    public TournamentSummaryResponse update(Long id, Long requesterId, TournamentRequest request) {
        Tournament tournament = getOrThrow(id);
        requireOwner(tournament, requesterId);

        if (request.name() != null) tournament.setName(request.name());
        if (request.sport() != null) tournament.setSport(request.sport());
        if (request.category() != null) tournament.setCategory(request.category());
        if (request.location() != null) tournament.setLocation(request.location());
        if (request.startDate() != null) tournament.setStartDate(request.startDate());
        if (request.endDate() != null) tournament.setEndDate(request.endDate());
        if (request.maxTeams() != null) tournament.setMaxTeams(request.maxTeams());
        applyOptionalFields(tournament, request);

        return TournamentSummaryResponse.from(tournament);
    }

    @Caching(evict = {
            @CacheEvict(value = "tournamentList", allEntries = true),
            @CacheEvict(value = "tournamentDetail", key = "#id")
    })
    @Transactional
    public void delete(Long id, Long requesterId) {
        Tournament tournament = getOrThrow(id);
        requireOwner(tournament, requesterId);
        tournamentRepository.delete(tournament);
    }

    /** No ownership check: the click comes from an anonymous spectator on the public page, not
     *  the organizer — see SecurityConfig, this endpoint is deliberately unauthenticated. */
    @CacheEvict(value = "tournamentDetail", key = "#id")
    @Transactional
    public void recordSponsorClick(Long id) {
        Tournament tournament = getOrThrow(id);
        tournament.setSponsorClicks(tournament.getSponsorClicks() + 1);
    }

    private void applyOptionalFields(Tournament tournament, TournamentRequest request) {
        if (request.description() != null) tournament.setDescription(request.description());
        if (request.format() != null) tournament.setFormat(request.format());
        if (request.splitEnabled() != null) tournament.setSplitEnabled(request.splitEnabled());
        if (request.terrains() != null) tournament.setTerrains(request.terrains());
        if (request.rules() != null) {
            boolean hasContent = !request.rules().isBlank();
            if (hasContent && !PlanLimits.of(tournament.getOrganizer().getPlan()).customRules()) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Le règlement personnalisé est réservé au plan Pro.");
            }
            tournament.setRules(request.rules());
        }
        applySponsorFields(tournament, request);
    }

    /** All three sponsor fields share one Pro gate: leaving any of them non-blank without the
     *  plan is rejected, but clearing them (blank) is always allowed regardless of plan — e.g. a
     *  downgraded organizer must still be able to remove a banner they can no longer configure. */
    private void applySponsorFields(Tournament tournament, TournamentRequest request) {
        boolean touchesSponsor = request.sponsorName() != null || request.sponsorLogoUrl() != null
                || request.sponsorClickUrl() != null;
        if (!touchesSponsor) return;

        boolean hasContent = hasText(request.sponsorName()) || hasText(request.sponsorLogoUrl())
                || hasText(request.sponsorClickUrl());
        if (hasContent && !PlanLimits.of(tournament.getOrganizer().getPlan()).sponsorBanner()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "La bannière sponsor est réservée au plan Pro.");
        }

        if (request.sponsorName() != null) tournament.setSponsorName(request.sponsorName());
        if (request.sponsorLogoUrl() != null) tournament.setSponsorLogoUrl(request.sponsorLogoUrl());
        if (request.sponsorClickUrl() != null) tournament.setSponsorClickUrl(request.sponsorClickUrl());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private Tournament getOrThrow(Long id) {
        return tournamentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tournoi introuvable."));
    }

    private void requireOwner(Tournament tournament, Long requesterId) {
        if (!tournament.getOrganizer().getId().equals(requesterId)) {
            throw new ForbiddenException();
        }
    }
}
