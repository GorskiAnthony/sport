package com.tournoicenter.security;

/** Ephemeral, account-less session minted by joining a tournament via its QR code
 *  (TournamentService.joinAsReferee) — not backed by a users row. joinToken is a snapshot of
 *  Tournament.refereeJoinToken at join time: MatchService compares it against the tournament's
 *  *current* value on every write, so regenerating the QR code invalidates already-issued
 *  sessions immediately instead of merely blocking new joins. */
public record RefereeSessionPrincipal(Long tournamentId, String refereeName, String joinToken) {
}
