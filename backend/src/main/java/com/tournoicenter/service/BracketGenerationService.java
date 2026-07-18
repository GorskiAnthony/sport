package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
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
import com.tournoicenter.service.bracket.GroupKnockoutGenerator;
import com.tournoicenter.service.bracket.GroupStandingsCalculator;
import com.tournoicenter.service.bracket.SingleEliminationGenerator;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
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
    private final TournamentLiveService tournamentLiveService;
    private final CacheManager cacheManager;

    public BracketGenerationService(TournamentRepository tournamentRepository,
                                     TeamRepository teamRepository,
                                     MatchRepository matchRepository,
                                     List<BracketGenerator> generators,
                                     SingleEliminationGenerator singleEliminationGenerator,
                                     TournamentLiveService tournamentLiveService,
                                     CacheManager cacheManager) {
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
        this.matchRepository = matchRepository;
        this.generators = generators;
        this.singleEliminationGenerator = singleEliminationGenerator;
        this.tournamentLiveService = tournamentLiveService;
        this.cacheManager = cacheManager;
    }

    @Transactional
    public List<MatchResponse> generate(Long tournamentId, Long requesterId, TournamentFormat format) {
        return generate(tournamentId, requesterId, format, null);
    }

    @Transactional
    public List<MatchResponse> generate(Long tournamentId, Long requesterId, TournamentFormat format, Integer groupCount) {
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

        List<Match> matches = generator.generateInitialRound(tournament, teams, groupCount);
        tournament.setFormat(format.name());

        List<MatchResponse> saved = matchRepository.saveAll(matches).stream().map(MatchResponse::from).toList();
        tournamentLiveService.notifyTournamentChanged(tournamentId);
        evictTournamentCaches(tournamentId);
        return saved;
    }

    @Transactional
    public BracketAdvanceResponse advance(Long tournamentId, Long requesterId) {
        Tournament tournament = getOrThrow(tournamentId);
        requireOwner(tournament, requesterId);

        BracketAdvanceResponse response;
        if (TournamentFormat.SINGLE_ELIMINATION.name().equals(tournament.getFormat())) {
            response = advanceSingleElimination(tournament, tournamentId);
        } else if (TournamentFormat.GROUP_KNOCKOUT.name().equals(tournament.getFormat())) {
            response = advanceGroupKnockout(tournament, tournamentId);
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ce tournoi n'utilise pas un tableau à élimination directe.");
        }
        evictTournamentCaches(tournamentId);
        return response;
    }

    /** BracketGenerationService mutates matches/tournament state that TournamentService's
     *  findAll()/findById() cache (see application.yml) — without this, an organizer who just
     *  loaded the tournament page (near-guaranteed, since that's how they got to the button)
     *  would click "Tour suivant"/"Générer le tableau" and see the cached pre-advance state for
     *  up to CACHE_TTL_SECONDS, looking exactly like the click "didn't do anything". */
    private void evictTournamentCaches(Long tournamentId) {
        Cache detailCache = cacheManager.getCache("tournamentDetail");
        if (detailCache != null) {
            detailCache.evict(tournamentId);
        }
        Cache listCache = cacheManager.getCache("tournamentList");
        if (listCache != null) {
            listCache.clear();
        }
    }

    private BracketAdvanceResponse advanceSingleElimination(Tournament tournament, Long tournamentId) {
        List<Match> allMatches = matchRepository.findByTournamentIdOrderByDateAsc(tournamentId);
        if (allMatches.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Générez d'abord le tableau initial.");
        }

        Map<String, List<Match>> byPhase = groupByPhaseInsertionOrder(allMatches);
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

        return respond(tournament, tournamentId, result);
    }

    private BracketAdvanceResponse advanceGroupKnockout(Tournament tournament, Long tournamentId) {
        List<Match> allMatches = matchRepository.findByTournamentIdOrderByDateAsc(tournamentId);
        if (allMatches.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Générez d'abord les poules.");
        }

        Map<String, List<Match>> byPhase = groupByPhaseInsertionOrder(allMatches);
        List<String> knockoutPhases = byPhase.keySet().stream()
                .filter(phase -> !GroupKnockoutGenerator.isGroupPhase(phase))
                .toList();

        if (!knockoutPhases.isEmpty()) {
            List<Match> currentRoundMatches = byPhase.get(knockoutPhases.get(knockoutPhases.size() - 1));
            int knockoutRoundsGenerated = knockoutPhases.size();

            List<Team> byeTeamsCarriedOver = List.of();
            if (knockoutRoundsGenerated == 1) {
                // Byes must be recomputed from the qualifier list, never from every tournament
                // team — otherwise a team eliminated in the group stage could reappear via a bye.
                List<Team> qualifiers = computeSeededQualifiers(byPhase);
                byeTeamsCarriedOver = singleEliminationGenerator.computeByeTeams(qualifiers);
            }

            BracketAdvanceResult result = singleEliminationGenerator.advance(
                    tournament, currentRoundMatches, byeTeamsCarriedOver, knockoutRoundsGenerated);
            return respond(tournament, tournamentId, result);
        }

        for (Match match : allMatches) {
            if (match.getStatus() != MatchStatus.FINISHED) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Tous les matchs de poules doivent être terminés.");
            }
        }

        List<Team> qualifiers = computeSeededQualifiers(byPhase);
        List<Match> knockoutRound1 = singleEliminationGenerator.generateInitialRound(tournament, qualifiers);
        List<MatchResponse> saved = matchRepository.saveAll(knockoutRound1).stream().map(MatchResponse::from).toList();
        tournamentLiveService.notifyTournamentChanged(tournamentId);
        return new BracketAdvanceResponse(saved, false, null);
    }

    /** Ranks each group (dropping the bottom 2), then interleaves qualifiers across groups —
     *  rotating each rank tier's group order — so round-1 knockout pairings avoid two teams
     *  from the same group facing each other where avoidable. This is a generic heuristic, not
     *  the fixed FIFA crossover fixture table (which only makes sense for a rigid 8-groups-of-4
     *  shape). Pure function of the (finished) group match results, so re-running it on a later
     *  advance() call reproduces the exact same list. */
    private List<Team> computeSeededQualifiers(Map<String, List<Match>> byPhase) {
        List<String> groupPhases = byPhase.keySet().stream()
                .filter(GroupKnockoutGenerator::isGroupPhase)
                .sorted(Comparator.naturalOrder())
                .toList();

        List<List<Team>> qualifiersByGroup = new ArrayList<>();
        for (String groupPhase : groupPhases) {
            List<GroupStandingsCalculator.Standing> standings = GroupStandingsCalculator.compute(byPhase.get(groupPhase));
            int qualifiedCount = Math.max(0, standings.size() - 2);
            List<Team> qualified = new ArrayList<>();
            for (int i = 0; i < qualifiedCount; i++) {
                qualified.add(standings.get(i).team());
            }
            qualifiersByGroup.add(qualified);
        }

        int maxRank = qualifiersByGroup.stream().mapToInt(List::size).max().orElse(0);
        List<Team> seeded = new ArrayList<>();
        for (int tier = 0; tier < maxRank; tier++) {
            int groupCount = qualifiersByGroup.size();
            for (int offset = 0; offset < groupCount; offset++) {
                List<Team> group = qualifiersByGroup.get((offset + tier) % groupCount);
                if (tier < group.size()) {
                    seeded.add(group.get(tier));
                }
            }
        }
        return seeded;
    }

    private Map<String, List<Match>> groupByPhaseInsertionOrder(List<Match> matches) {
        Map<String, List<Match>> byPhase = new LinkedHashMap<>();
        for (Match match : matches) {
            byPhase.computeIfAbsent(match.getPhase(), key -> new ArrayList<>()).add(match);
        }
        return byPhase;
    }

    private BracketAdvanceResponse respond(Tournament tournament, Long tournamentId, BracketAdvanceResult result) {
        if (result.isComplete()) {
            tournament.setStatus(TournamentStatus.FINISHED);
            TeamResponse champion = result.champion() != null ? TeamResponse.from(result.champion()) : null;
            tournamentLiveService.notifyTournamentChanged(tournamentId);
            return new BracketAdvanceResponse(List.of(), true, champion);
        }

        List<MatchResponse> saved = matchRepository.saveAll(result.nextRoundMatches()).stream()
                .map(MatchResponse::from).toList();
        tournamentLiveService.notifyTournamentChanged(tournamentId);
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
