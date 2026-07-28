package com.tournoicenter.dto.tournament;

import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentStatus;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.dto.team.TeamResponse;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record TournamentDetailResponse(
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
        String rules,
        String terrains,
        String sponsorName,
        String sponsorLogoUrl,
        String sponsorClickUrl,
        int sponsorClicks,
        String format,
        String icon,
        boolean splitEnabled,
        Instant eventPassExpiresAt,
        Long organizerId,
        List<TeamResponse> teams,
        List<MatchResponse> matches,
        Instant createdAt,
        Instant updatedAt
) {
    public static TournamentDetailResponse from(Tournament t) {
        return new TournamentDetailResponse(
                t.getId(), t.getName(), t.getSport(), t.getCategory(), t.getLocation(),
                t.getStartDate(), t.getEndDate(), t.getStatus(), t.getMaxTeams(), t.getDescription(),
                t.getRules(), t.getTerrains(), t.getSponsorName(), t.getSponsorLogoUrl(), t.getSponsorClickUrl(),
                t.getSponsorClicks(), t.getFormat(), t.getIcon(), t.isSplitEnabled(), t.getEventPassExpiresAt(),
                t.getOrganizer().getId(),
                t.getTeams().stream().map(TeamResponse::from).toList(),
                t.getMatches().stream().map(MatchResponse::from).toList(),
                t.getCreatedAt(), t.getUpdatedAt()
        );
    }
}
