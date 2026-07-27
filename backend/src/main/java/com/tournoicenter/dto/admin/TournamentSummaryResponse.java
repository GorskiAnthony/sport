package com.tournoicenter.dto.admin;

import com.tournoicenter.domain.TournamentStatus;

import java.time.Instant;
import java.time.LocalDate;

public record TournamentSummaryResponse(
        Long id,
        String name,
        String sport,
        String location,
        TournamentStatus status,
        LocalDate startDate,
        LocalDate endDate,
        String organizerName,
        String organizerEmail,
        long teamsCount,
        long matchesCount,
        Instant createdAt
) {
}
