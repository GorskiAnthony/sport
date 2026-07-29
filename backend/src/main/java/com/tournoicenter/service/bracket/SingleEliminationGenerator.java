package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;
import com.tournoicenter.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Single-elimination bracket. Since a Match row cannot represent a "bye" (both team
 * columns are NOT NULL in the schema), byes are never persisted: the bracket structure
 * is recomputed on demand from the original team order rather than stored anywhere.
 * Byes only ever occur in round 1 — from round 2 onward the participant count is always
 * an exact power of two, so pairing is always a plain sequential split.
 */
@Component
public class SingleEliminationGenerator implements BracketGenerator {

    private static final Map<Integer, String> ROUND_LABELS = Map.of(
            2, "Finale",
            4, "Demi-finales",
            8, "Quarts de finale",
            16, "Huitièmes de finale",
            32, "Seizièmes de finale",
            64, "Trente-deuxièmes de finale",
            128, "Soixante-quatrièmes de finale"
    );

    @Override
    public boolean supports(TournamentFormat format) {
        return format == TournamentFormat.SINGLE_ELIMINATION;
    }

    @Override
    public List<Match> generateInitialRound(Tournament tournament, List<Team> teams) {
        int bracketSize = nextPowerOfTwo(teams.size());
        List<Team> byeTeams = computeByeTeams(teams);
        List<Team> playingTeams = teams.subList(0, teams.size() - byeTeams.size());

        String phase = roundLabel(bracketSize);
        List<Match> matches = new ArrayList<>();
        for (int i = 0; i < playingTeams.size(); i += 2) {
            matches.add(new Match(tournament, playingTeams.get(i), playingTeams.get(i + 1), phase, roundDate(tournament, 0)));
        }
        return matches;
    }

    /** Teams that skip round 1 entirely because the bracket isn't a full power of two. */
    public List<Team> computeByeTeams(List<Team> teams) {
        int bracketSize = nextPowerOfTwo(teams.size());
        int byeCount = bracketSize - teams.size();
        return byeCount == 0 ? List.of() : teams.subList(teams.size() - byeCount, teams.size());
    }

    /**
     * Computes the next round from the just-finished current round. {@code byeTeamsCarriedOver}
     * must only be non-empty when advancing away from round 1 (the only round that can have byes).
     */
    public BracketAdvanceResult advance(Tournament tournament, List<Match> currentRoundMatches,
                                         List<Team> byeTeamsCarriedOver, int nextRoundIndex) {
        List<Team> winners = new ArrayList<>();
        for (Match match : currentRoundMatches) {
            if (match.getStatus() == MatchStatus.FORFEIT) {
                Team forfeited = match.getForfeitedTeam();
                winners.add(forfeited.equals(match.getHomeTeam()) ? match.getAwayTeam() : match.getHomeTeam());
                continue;
            }
            if (match.getStatus() != MatchStatus.FINISHED || match.getHomeScore() == null || match.getAwayScore() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Le tour en cours n'est pas terminé.");
            }
            if (match.getHomeScore().equals(match.getAwayScore())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Chaque match à élimination directe doit avoir un vainqueur.");
            }
            winners.add(match.getHomeScore() > match.getAwayScore() ? match.getHomeTeam() : match.getAwayTeam());
        }
        winners.addAll(byeTeamsCarriedOver);

        if (winners.size() <= 1) {
            return BracketAdvanceResult.complete(winners.isEmpty() ? null : winners.get(0));
        }

        String phase = roundLabel(winners.size());
        List<Match> nextRound = new ArrayList<>();
        for (int i = 0; i < winners.size(); i += 2) {
            nextRound.add(new Match(tournament, winners.get(i), winners.get(i + 1), phase, roundDate(tournament, nextRoundIndex)));
        }
        return BracketAdvanceResult.nextRound(nextRound);
    }

    private String roundLabel(int participantCount) {
        return ROUND_LABELS.getOrDefault(participantCount, "Tour de " + participantCount);
    }

    private Instant roundDate(Tournament tournament, int roundIndex) {
        return tournament.getStartDate().plusDays(roundIndex).atTime(10, 0).toInstant(ZoneOffset.UTC);
    }

    private int nextPowerOfTwo(int n) {
        int power = 1;
        while (power < n) {
            power *= 2;
        }
        return power;
    }
}
