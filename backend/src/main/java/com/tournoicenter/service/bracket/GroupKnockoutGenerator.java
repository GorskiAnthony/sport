package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;
import com.tournoicenter.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * World-Cup-style format: teams are split randomly into an organizer-chosen number of
 * groups (as evenly as possible), each group plays round robin, then the bottom 2 of each
 * group are eliminated and the rest move on to a single-elimination knockout — see
 * BracketGenerationService.advanceGroupKnockout() for the group-to-knockout transition.
 * Group membership isn't persisted anywhere: it's fully recoverable at any time from which
 * "Groupe X"-phase matches a team appears in, the same way SingleEliminationGenerator never
 * persists bracket size or byes.
 */
@Component
public class GroupKnockoutGenerator implements BracketGenerator {

    /** Caps group labels at single letters (A-Z) — a tournament with more groups than this is unrealistic. */
    private static final int MAX_GROUPS = 26;

    /** A group needs at least 3 teams for "drop the bottom 2" to actually eliminate anyone. */
    private static final int MIN_TEAMS_PER_GROUP = 3;

    static final String GROUP_PHASE_PREFIX = "Groupe ";

    @Override
    public boolean supports(TournamentFormat format) {
        return format == TournamentFormat.GROUP_KNOCKOUT;
    }

    @Override
    public List<Match> generateInitialRound(Tournament tournament, List<Team> teams) {
        return generateInitialRound(tournament, teams, null);
    }

    @Override
    public List<Match> generateInitialRound(Tournament tournament, List<Team> teams, Integer groupCount) {
        validate(teams, groupCount);

        List<Team> shuffled = new ArrayList<>(teams);
        Collections.shuffle(shuffled);

        List<List<Team>> groups = new ArrayList<>();
        for (int g = 0; g < groupCount; g++) {
            groups.add(new ArrayList<>());
        }
        for (int i = 0; i < shuffled.size(); i++) {
            groups.get(i % groupCount).add(shuffled.get(i));
        }

        List<String> labels = new ArrayList<>(groups.size());
        for (int g = 0; g < groups.size(); g++) {
            labels.add(groupLabel(g));
        }
        return RoundRobinPairing.pairAllGroups(tournament, groups, labels);
    }

    private void validate(List<Team> teams, Integer groupCount) {
        if (groupCount == null || groupCount < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nombre de poules requis pour ce format.");
        }
        if (groupCount > MAX_GROUPS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trop de poules (maximum " + MAX_GROUPS + ").");
        }
        if (Math.floorDiv(teams.size(), groupCount) < MIN_TEAMS_PER_GROUP) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Avec ce nombre de poules, certaines poules auraient moins de " + MIN_TEAMS_PER_GROUP + " équipes.");
        }
    }

    static String groupLabel(int groupIndex) {
        return GROUP_PHASE_PREFIX + (char) ('A' + groupIndex);
    }

    public static boolean isGroupPhase(String phase) {
        return phase != null && phase.startsWith(GROUP_PHASE_PREFIX);
    }
}
