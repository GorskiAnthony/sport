package com.tournoicenter.dto.tournament;

import com.tournoicenter.domain.TournamentView;

import java.time.Instant;

public record RecentTournamentResponse(
        TournamentSummaryResponse tournament,
        Instant firstViewedAt,
        Instant lastViewedAt
) {
    public static RecentTournamentResponse from(TournamentView view) {
        return new RecentTournamentResponse(
                TournamentSummaryResponse.from(view.getTournament()),
                view.getFirstViewedAt(),
                view.getLastViewedAt()
        );
    }
}
