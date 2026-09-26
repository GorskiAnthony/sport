package com.matchday.service;

import com.matchday.domain.MatchStatus;
import com.matchday.domain.TournamentStatus;
import com.matchday.domain.User;
import com.matchday.dto.dashboard.MatchStatusCounts;
import com.matchday.dto.dashboard.OrganizerDashboardResponse;
import com.matchday.dto.dashboard.PlanUsageResponse;
import com.matchday.dto.dashboard.TournamentStatusCounts;
import com.matchday.dto.match.MatchResponse;
import com.matchday.repository.MatchRepository;
import com.matchday.repository.TeamRepository;
import com.matchday.repository.TournamentRepository;
import com.matchday.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class DashboardService {

    private static final int UPCOMING_WINDOW_DAYS = 14;

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    public DashboardService(TournamentRepository tournamentRepository, TeamRepository teamRepository,
                             MatchRepository matchRepository, UserRepository userRepository) {
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
        this.matchRepository = matchRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public OrganizerDashboardResponse getOrganizerStats(Long organizerId) {
        long totalTournaments = tournamentRepository.countByOrganizerId(organizerId);
        long upcomingTournaments = tournamentRepository.countByOrganizerIdAndStatus(organizerId, TournamentStatus.UPCOMING);
        long ongoingTournaments = tournamentRepository.countByOrganizerIdAndStatus(organizerId, TournamentStatus.ONGOING);
        long finishedTournaments = tournamentRepository.countByOrganizerIdAndStatus(organizerId, TournamentStatus.FINISHED);

        long teamsCount = teamRepository.countByTournamentOrganizerId(organizerId);

        long totalMatches = matchRepository.countByTournamentOrganizerId(organizerId);
        long scheduledMatches = matchRepository.countByTournamentOrganizerIdAndStatus(organizerId, MatchStatus.SCHEDULED);
        long ongoingMatches = matchRepository.countByTournamentOrganizerIdAndStatus(organizerId, MatchStatus.ONGOING);
        long finishedMatches = matchRepository.countByTournamentOrganizerIdAndStatus(organizerId, MatchStatus.FINISHED);

        Instant now = Instant.now();
        List<MatchResponse> upcomingMatches = matchRepository
                .findTop10ByTournamentOrganizerIdAndStatusAndDateBetweenOrderByDateAsc(
                        organizerId, MatchStatus.SCHEDULED, now, now.plus(UPCOMING_WINDOW_DAYS, ChronoUnit.DAYS))
                .stream().map(MatchResponse::from).toList();

        User organizer = userRepository.getReferenceById(organizerId);
        PlanUsageResponse plan = PlanUsageResponse.of(organizer.getPlan(), totalTournaments);

        return new OrganizerDashboardResponse(
                new TournamentStatusCounts(totalTournaments, upcomingTournaments, ongoingTournaments, finishedTournaments),
                teamsCount,
                new MatchStatusCounts(totalMatches, scheduledMatches, ongoingMatches, finishedMatches),
                plan,
                upcomingMatches
        );
    }
}
