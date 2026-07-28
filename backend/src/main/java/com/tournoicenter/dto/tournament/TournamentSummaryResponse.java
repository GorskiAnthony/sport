package com.tournoicenter.dto.tournament;

import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentStatus;

import java.time.Instant;
import java.time.LocalDate;

public record TournamentSummaryResponse(
        Long id,
        String name,
        String sport,
        String category,
        String location,
        LocalDate startDate,
        LocalDate endDate,
        TournamentStatus status,
        Integer maxTeams,
        String description,
        String format,
        String icon,
        boolean splitEnabled,
        Instant eventPassExpiresAt,
        Long organizerId,
        int teamsCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static TournamentSummaryResponse from(Tournament t) {
        return new TournamentSummaryResponse(
                t.getId(), t.getName(), t.getSport(), t.getCategory(), t.getLocation(),
                t.getStartDate(), t.getEndDate(), t.getStatus(), t.getMaxTeams(), t.getDescription(),
                t.getFormat(), t.getIcon(), t.isSplitEnabled(), t.getEventPassExpiresAt(), t.getOrganizer().getId(),
                t.getTeams().size(), t.getCreatedAt(), t.getUpdatedAt()
        );
    }
}
