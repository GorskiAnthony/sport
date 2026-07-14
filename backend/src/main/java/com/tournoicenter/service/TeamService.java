package com.tournoicenter.service;

import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.dto.team.TeamRequest;
import com.tournoicenter.dto.team.TeamResponse;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TournamentRepository tournamentRepository;
    private final PlanLimitService planLimitService;

    public TeamService(TeamRepository teamRepository, TournamentRepository tournamentRepository, PlanLimitService planLimitService) {
        this.teamRepository = teamRepository;
        this.tournamentRepository = tournamentRepository;
        this.planLimitService = planLimitService;
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
