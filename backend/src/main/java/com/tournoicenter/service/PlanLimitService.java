package com.tournoicenter.service;

import com.tournoicenter.domain.Plan;
import com.tournoicenter.exception.PlanLimitExceededException;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import org.springframework.stereotype.Service;

@Service
public class PlanLimitService {

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;

    public PlanLimitService(TournamentRepository tournamentRepository, TeamRepository teamRepository) {
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
    }

    public void checkTournamentLimit(Long organizerId, Plan plan) {
        PlanLimits limits = PlanLimits.of(plan);
        if (limits.maxTournaments() == Integer.MAX_VALUE) {
            return;
        }
        long count = tournamentRepository.countByOrganizerId(organizerId);
        if (count >= limits.maxTournaments()) {
            throw new PlanLimitExceededException(
                    "Limite de %d tournoi(s) atteinte sur votre plan.".formatted(limits.maxTournaments()));
        }
    }

    public void checkTeamLimit(Long tournamentId, Plan plan) {
        PlanLimits limits = PlanLimits.of(plan);
        if (limits.maxTeams() == Integer.MAX_VALUE) {
            return;
        }
        long count = teamRepository.countByTournamentId(tournamentId);
        if (count >= limits.maxTeams()) {
            throw new PlanLimitExceededException(
                    "Limite de %d équipe(s) atteinte sur votre plan.".formatted(limits.maxTeams()));
        }
    }
}
