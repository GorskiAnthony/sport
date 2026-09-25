package com.matchday.dto.tournament;

public record TournamentJoinResponse(String sessionToken, Long tournamentId, String tournamentName) {
}
