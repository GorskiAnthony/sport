package com.tournoicenter.service;

import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.tournament.TournamentDetailResponse;
import com.tournoicenter.dto.tournament.TournamentRequest;
import com.tournoicenter.dto.tournament.TournamentSummaryResponse;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TournamentRepository;
import com.tournoicenter.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final PlanLimitService planLimitService;
    private final MatchRepository matchRepository;

    public TournamentService(TournamentRepository tournamentRepository, UserRepository userRepository,
                              PlanLimitService planLimitService, MatchRepository matchRepository) {
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
        this.planLimitService = planLimitService;
        this.matchRepository = matchRepository;
    }

    @Transactional(readOnly = true)
    public List<TournamentSummaryResponse> findAll() {
        return tournamentRepository.findAllByOrderByStartDateDesc().stream().map(TournamentSummaryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TournamentSummaryResponse> findMine(Long organizerId) {
        return tournamentRepository.findByOrganizerIdOrderByCreatedAtDesc(organizerId).stream()
                .map(TournamentSummaryResponse::from).toList();
    }

    @Transactional
    public TournamentDetailResponse findById(Long id) {
        Tournament tournament = getOrThrow(id);
        RoundRobinStatusSync.sync(tournament, matchRepository.findByTournamentIdOrderByDateAsc(id));
        return TournamentDetailResponse.from(tournament);
    }

    @Transactional
    public TournamentSummaryResponse create(Long organizerId, TournamentRequest request) {
        User organizer = userRepository.getReferenceById(organizerId);
        planLimitService.checkTournamentLimit(organizerId, organizer.getPlan());

        Tournament tournament = new Tournament(
                request.name(), request.sport(), request.category(), request.location(),
                request.startDate(), request.endDate(),
                request.maxTeams() != null ? request.maxTeams() : 14,
                organizer
        );
        applyOptionalFields(tournament, request);

        return TournamentSummaryResponse.from(tournamentRepository.save(tournament));
    }

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

    @Transactional
    public void delete(Long id, Long requesterId) {
        Tournament tournament = getOrThrow(id);
        requireOwner(tournament, requesterId);
        tournamentRepository.delete(tournament);
    }

    private void applyOptionalFields(Tournament tournament, TournamentRequest request) {
        if (request.description() != null) tournament.setDescription(request.description());
        if (request.format() != null) tournament.setFormat(request.format());
        if (request.splitEnabled() != null) tournament.setSplitEnabled(request.splitEnabled());
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
