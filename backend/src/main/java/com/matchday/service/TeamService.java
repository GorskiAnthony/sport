package com.matchday.service;

import com.matchday.domain.Team;
import com.matchday.domain.Tournament;
import com.matchday.dto.team.TeamRequest;
import com.matchday.dto.team.TeamResponse;
import com.matchday.exception.ApiException;
import com.matchday.exception.ForbiddenException;
import com.matchday.exception.ResourceNotFoundException;
import com.matchday.repository.TeamRepository;
import com.matchday.repository.TournamentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TournamentRepository tournamentRepository;
    private final PlanLimitService planLimitService;
    private final TournamentLiveService tournamentLiveService;

    public TeamService(TeamRepository teamRepository, TournamentRepository tournamentRepository,
                        PlanLimitService planLimitService, TournamentLiveService tournamentLiveService) {
        this.teamRepository = teamRepository;
        this.tournamentRepository = tournamentRepository;
        this.planLimitService = planLimitService;
        this.tournamentLiveService = tournamentLiveService;
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> findByTournament(Long tournamentId) {
        return teamRepository.findByTournamentIdOrderByNameAsc(tournamentId).stream().map(TeamResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public TeamResponse findById(Long id) {
        return TeamResponse.from(getOrThrow(id));
    }

    @Transactional
    public TeamResponse create(Long requesterId, TeamRequest request) {
        Tournament tournament = tournamentRepository.findById(request.tournamentId())
                .orElseThrow(() -> new ResourceNotFoundException("Tournoi introuvable."));
        if (!tournament.getOrganizer().getId().equals(requesterId)) {
            throw new ForbiddenException();
        }
        planLimitService.checkTeamLimit(tournament.getId(), tournament.getOrganizer().getPlan());

        Team team = new Team(request.name(), request.category(), tournament);
        team.setClub(request.club());
        team.setLogo(request.logo());
        team.setContact(request.contact());

        return TeamResponse.from(teamRepository.save(team));
    }

    @Transactional
    public TeamResponse update(Long id, Long requesterId, TeamRequest request) {
        Team team = getOrThrow(id);
        requireOwner(team, requesterId);

        if (request.name() != null) team.setName(request.name());
        if (request.club() != null) team.setClub(request.club());
        if (request.logo() != null) team.setLogo(request.logo());
        if (request.category() != null) team.setCategory(request.category());
        if (request.contact() != null) team.setContact(request.contact());

        return TeamResponse.from(team);
    }

    /** Public — no team account exists, so any team representative can self-check-in by tapping
     *  their name on the check-in page reached via the tournament's shared QR/link (see
     *  TeamCheckinPage). Idempotent: a second tap doesn't reset the original arrival time. */
    @Transactional
    public TeamResponse checkIn(Long id) {
        Team team = getOrThrow(id);
        if (!PlanLimits.of(team.getTournament().getOrganizer().getPlan()).checkIn()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Le check-in équipes est réservé aux plans Classic et Pro.");
        }
        if (team.getCheckedInAt() == null) {
            team.setCheckedInAt(Instant.now());
            tournamentLiveService.notifyTournamentChanged(team.getTournament().getId());
        }
        return TeamResponse.from(team);
    }

    @Transactional
    public TeamResponse undoCheckIn(Long id, Long requesterId) {
        Team team = getOrThrow(id);
        requireOwner(team, requesterId);
        team.setCheckedInAt(null);
        return TeamResponse.from(team);
    }

    @Transactional
    public void delete(Long id, Long requesterId) {
        Team team = getOrThrow(id);
        requireOwner(team, requesterId);
        teamRepository.delete(team);
    }

    private Team getOrThrow(Long id) {
        return teamRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Équipe introuvable."));
    }

    private void requireOwner(Team team, Long requesterId) {
        if (!team.getTournament().getOrganizer().getId().equals(requesterId)) {
            throw new ForbiddenException();
        }
    }
}
