package com.matchday.dto.team;

import com.matchday.domain.Team;

import java.time.Instant;

public record TeamResponse(
        Long id,
        String name,
        String club,
        String logo,
        String category,
        String contact,
        Long tournamentId,
        Instant createdAt,
        Instant updatedAt,
        Instant checkedInAt
) {
    public static TeamResponse from(Team team) {
        return new TeamResponse(
                team.getId(), team.getName(), team.getClub(), team.getLogo(), team.getCategory(),
                team.getContact(), team.getTournament().getId(), team.getCreatedAt(), team.getUpdatedAt(),
                team.getCheckedInAt()
        );
    }
}
