package com.tournoicenter.dto.tournament;

/** Organisateur uniquement — le token est un secret, voir Tournament.refereeJoinToken. */
public record RefereeJoinInfoResponse(String token, String joinUrl) {
}
