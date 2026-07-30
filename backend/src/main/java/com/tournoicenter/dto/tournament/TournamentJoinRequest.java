package com.tournoicenter.dto.tournament;

import jakarta.validation.constraints.NotBlank;

/** refereeName est optionnel — voir TournamentService.joinAsReferee : anonyme par défaut. */
public record TournamentJoinRequest(@NotBlank String token, String refereeName) {
}
