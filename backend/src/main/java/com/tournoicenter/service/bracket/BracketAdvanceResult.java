package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;

import java.util.List;

/**
 * Result of advancing a single-elimination bracket by one round: either the next
 * round's matches, or the tournament champion if only one team remains.
 */
public record BracketAdvanceResult(List<Match> nextRoundMatches, Team champion) {

    public static BracketAdvanceResult nextRound(List<Match> matches) {
        return new BracketAdvanceResult(matches, null);
    }

    public static BracketAdvanceResult complete(Team champion) {
        return new BracketAdvanceResult(List.of(), champion);
    }

    public boolean isComplete() {
        return champion != null;
    }
}
