package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;
import com.tournoicenter.domain.TournamentStatus;
import com.tournoicenter.dto.bracket.BracketAdvanceResponse;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.dto.team.TeamResponse;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import com.tournoicenter.service.bracket.BracketAdvanceResult;
import com.tournoicenter.service.bracket.BracketGenerator;
import com.tournoicenter.service.bracket.SingleEliminationGenerator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BracketGenerationService {

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;
    private final List<BracketGenerator> generators;
    private final SingleEliminationGenerator singleEliminationGenerator;

    public BracketGenerationService(TournamentRepository tournamentRepository,
                                     TeamRepository teamRepository,
                                     MatchRepository matchRepository,
                                     List<BracketGenerator> generators,
                                     SingleEliminationGenerator singleEliminationGenerator) {
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
        this.matchRepository = matchRepository;
        this.generators = generators;
        this.singleEliminationGenerator = singleEliminationGenerator;
    }

    @Transactional
    public List<MatchResponse> generate(Long tournamentId, Long requesterId, TournamentFormat format) {
        Tournament tournament = getOrThrow(tournamentId);
        requireOwner(tournament, requesterId);

        List<Team> teams = teamRepository.findByTournamentIdOrderByNameAsc(tournamentId);
        if (teams.size() < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Il faut au moins 2 équipes pour générer un tableau.");
        }
        if (!matchRepository.findByTournamentIdOrderByDateAsc(tournamentId).isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Des matchs existent déjà pour ce tournoi.");
        }

        BracketGenerator generator = generators.stream()
                .filter(g -> g.supports(format))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Format non supporté."));

        List<Match> matches = generator.generateInitialRound(tournament, teams);
        tournament.setFormat(format.name());

        return matchRepository.saveAll(matches).stream().map(MatchResponse::from).toList();
    }

    @Transactional
    public BracketAdvanceResponse advance(Long tournamentId, Long requesterId) {
        Tournament tournament = getOrThrow(tournamentId);
        requireOwner(tournament, requesterId);

        if (!TournamentFormat.SINGLE_ELIMINATION.name().equals(tournament.getFormat())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ce tournoi n'utilise pas un tableau à élimination directe.");
        }

        List<Match> allMatches = matchRepository.findByTournamentIdOrderByDateAsc(tournamentId);
        if (allMatches.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Générez d'abord le tableau initial.");
        }

        Map<String, List<Match>> byPhase = new LinkedHashMap<>();
        for (Match match : allMatches) {
            byPhase.computeIfAbsent(match.getPhase(), key -> new ArrayList<>()).add(match);
        }
        List<String> phaseOrder = new ArrayList<>(byPhase.keySet());
        List<Match> currentRoundMatches = byPhase.get(phaseOrder.get(phaseOrder.size() - 1));
        int roundsGenerated = phaseOrder.size();

        List<Team> byeTeamsCarriedOver = List.of();
        if (roundsGenerated == 1) {
            List<Team> teams = teamRepository.findByTournamentIdOrderByNameAsc(tournamentId);
            byeTeamsCarriedOver = singleEliminationGenerator.computeByeTeams(teams);
        }

        BracketAdvanceResult result = singleEliminationGenerator.advance(
                tournament, currentRoundMatches, byeTeamsCarriedOver, roundsGenerated);

        if (result.isComplete()) {
            tournament.setStatus(TournamentStatus.FINISHED);
            TeamResponse champion = result.champion() != null ? TeamResponse.from(result.champion()) : null;
            return new BracketAdvanceResponse(List.of(), true, champion);
        }

        List<MatchResponse> saved = matchRepository.saveAll(result.nextRoundMatches()).stream()
                .map(MatchResponse::from).toList();
        return new BracketAdvanceResponse(saved, false, null);
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
