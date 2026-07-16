package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentFormat;
import com.tournoicenter.domain.TournamentStatus;

import java.util.List;

/** Round Robin creates every match upfront in a single phase (no round-by-round advance step
 *  like Single Elimination), so tournament progress can be derived directly from how many of
 *  those matches have a recorded score. Shared by MatchService (on score save) and
 *  TournamentService (on read, so tournaments scored before this logic existed self-heal). */
final class RoundRobinStatusSync {

    private RoundRobinStatusSync() {
    }

    static void sync(Tournament tournament, List<Match> matches) {
        if (!TournamentFormat.ROUND_ROBIN.name().equals(tournament.getFormat())) {
            return;
        }
        if (tournament.getStatus() == TournamentStatus.FINISHED) {
            return;
        }

        boolean allFinished = !matches.isEmpty() && matches.stream().allMatch(m -> m.getStatus() == MatchStatus.FINISHED);
        if (allFinished) {
            tournament.setStatus(TournamentStatus.FINISHED);
        } else if (tournament.getStatus() == TournamentStatus.UPCOMING) {
            tournament.setStatus(TournamentStatus.ONGOING);
        }
    }
}
