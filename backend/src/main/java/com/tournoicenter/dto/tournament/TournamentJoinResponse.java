package com.tournoicenter.dto.tournament;

public record TournamentJoinResponse(String sessionToken, Long tournamentId, String tournamentName) {
}
