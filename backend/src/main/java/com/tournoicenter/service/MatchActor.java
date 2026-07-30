package com.tournoicenter.service;

/** Who is asking to start/score a match: either a real logged-in user (the tournament's
 *  organizer) or an ephemeral tournament-scoped referee session minted by scanning a
 *  tournament's QR code (see TournamentService.joinAsReferee) — no backing users row. */
public sealed interface MatchActor permits MatchActor.UserActor, MatchActor.TournamentSessionActor {

    record UserActor(Long userId) implements MatchActor {
    }

    record TournamentSessionActor(Long tournamentId, String joinToken) implements MatchActor {
    }
}
