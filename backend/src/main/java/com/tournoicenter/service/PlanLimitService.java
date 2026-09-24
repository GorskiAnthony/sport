package com.tournoicenter.service;

import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.exception.PlanLimitExceededException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;

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
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournoi introuvable."));

        boolean hasActiveEventPass = tournament.getEventPassExpiresAt() != null
                && tournament.getEventPassExpiresAt().isAfter(Instant.now());
        if (hasActiveEventPass) {
            return;
        }

        PlanLimits limits = PlanLimits.of(plan);
        // Le nombre max d'équipes est aussi réglable par tournoi (formulaire de création/édition) :
        // c'est une limite indépendante de celle du plan, les deux s'appliquent.
        int effectiveLimit = Math.min(limits.maxTeams(), tournament.getMaxTeams());

        long count = teamRepository.countByTournamentId(tournamentId);
        if (count >= effectiveLimit) {
            throw new PlanLimitExceededException(
                    "Limite de %d équipe(s) atteinte pour ce tournoi.".formatted(effectiveLimit));
        }
    }
}
