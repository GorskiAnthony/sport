package com.tournoicenter.service;

import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentStatus;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.admin.AdminOverviewResponse;
import com.tournoicenter.dto.admin.GrowthPoint;
import com.tournoicenter.dto.admin.LocationStatsResponse;
import com.tournoicenter.dto.admin.PlanCount;
import com.tournoicenter.dto.admin.TournamentSummaryResponse;
import com.tournoicenter.dto.admin.UserCounts;
import com.tournoicenter.dto.admin.UserDetailResponse;
import com.tournoicenter.dto.admin.UserSummaryResponse;
import com.tournoicenter.dto.dashboard.MatchStatusCounts;
import com.tournoicenter.dto.dashboard.TournamentStatusCounts;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import com.tournoicenter.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final int GROWTH_WINDOW_DAYS = 30;
    private static final int LIST_CAP = 100;
    private static final int LOCATIONS_CAP = 20;

    private final UserRepository userRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    public AdminService(UserRepository userRepository, TournamentRepository tournamentRepository,
                         TeamRepository teamRepository, MatchRepository matchRepository) {
        this.userRepository = userRepository;
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
        this.matchRepository = matchRepository;
    }

    @Transactional(readOnly = true)
    public AdminOverviewResponse getOverview() {
        UserCounts users = new UserCounts(
                userRepository.count(),
                userRepository.countByRole(Role.ORGANIZER),
                userRepository.countByRole(Role.SPECTATOR),
                userRepository.countByRole(Role.ADMIN)
        );

        TournamentStatusCounts tournaments = new TournamentStatusCounts(
                tournamentRepository.count(),
                tournamentRepository.countByStatus(TournamentStatus.UPCOMING),
                tournamentRepository.countByStatus(TournamentStatus.ONGOING),
                tournamentRepository.countByStatus(TournamentStatus.FINISHED)
        );

        MatchStatusCounts matches = new MatchStatusCounts(
                matchRepository.count(),
                matchRepository.countByStatus(MatchStatus.SCHEDULED),
                matchRepository.countByStatus(MatchStatus.ONGOING),
                matchRepository.countByStatus(MatchStatus.FINISHED)
        );

        List<PlanCount> planBreakdown = userRepository.countGroupedByPlan().stream()
                .map(p -> new PlanCount(p.getPlan(), p.getCount()))
                .toList();

        Instant since = Instant.now().minus(GROWTH_WINDOW_DAYS, ChronoUnit.DAYS);
        List<GrowthPoint> signups = userRepository.countSignupsSince(since).stream()
                .map(d -> new GrowthPoint(d.getDay(), d.getCount()))
                .toList();
        List<GrowthPoint> tournamentsCreated = tournamentRepository.countCreatedSince(since).stream()
                .map(d -> new GrowthPoint(d.getDay(), d.getCount()))
                .toList();

        return new AdminOverviewResponse(users, tournaments, matches, teamRepository.count(),
                planBreakdown, signups, tournamentsCreated);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> searchUsers(String search) {
        PageRequest cap = PageRequest.of(0, LIST_CAP);
        List<User> found = (search == null || search.isBlank())
                ? userRepository.findAllByOrderByCreatedAtDesc(cap)
                : userRepository.search(search.trim(), cap);

        Map<Long, Long> tournamentCounts = countGroupedBy(
                found.stream().map(User::getId).toList(),
                tournamentRepository::countGroupedByOrganizerIdIn,
                TournamentRepository.OrganizerCount::getOrganizerId,
                TournamentRepository.OrganizerCount::getCount);

        return found.stream()
                .map(user -> toUserSummary(user, tournamentCounts.getOrDefault(user.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDetailResponse getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        List<TournamentSummaryResponse> tournaments = toTournamentSummaries(
                tournamentRepository.findByOrganizerIdOrderByCreatedAtDesc(userId));

        String subscriptionStatus = user.getSubscription() != null ? user.getSubscription().getStatus() : null;

        return new UserDetailResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(),
                user.getPlan(), user.getCreatedAt(), subscriptionStatus, tournaments);
    }

    @Transactional(readOnly = true)
    public List<TournamentSummaryResponse> searchTournaments(String search, TournamentStatus status) {
        String query = (search == null || search.isBlank()) ? null : search.trim();
        List<Tournament> found = tournamentRepository.search(query, status, PageRequest.of(0, LIST_CAP));
        return toTournamentSummaries(found);
    }

    @Transactional(readOnly = true)
    public List<LocationStatsResponse> getLocationStats() {
        return tournamentRepository.countGroupedByLocation(PageRequest.of(0, LOCATIONS_CAP)).stream()
                .map(l -> new LocationStatsResponse(l.getLocation(), l.getCount()))
                .toList();
    }

    private UserSummaryResponse toUserSummary(User user, long tournamentsCount) {
        return new UserSummaryResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(),
                user.getPlan(), user.getCreatedAt(), tournamentsCount);
    }

    private List<TournamentSummaryResponse> toTournamentSummaries(List<Tournament> tournaments) {
        List<Long> tournamentIds = tournaments.stream().map(Tournament::getId).toList();
        Map<Long, Long> teamCounts = countGroupedBy(tournamentIds, teamRepository::countGroupedByTournamentIdIn,
                TeamRepository.TournamentCount::getTournamentId, TeamRepository.TournamentCount::getCount);
        Map<Long, Long> matchCounts = countGroupedBy(tournamentIds, matchRepository::countGroupedByTournamentIdIn,
                MatchRepository.TournamentCount::getTournamentId, MatchRepository.TournamentCount::getCount);

        return tournaments.stream()
                .map(t -> toTournamentSummary(t, teamCounts.getOrDefault(t.getId(), 0L),
                        matchCounts.getOrDefault(t.getId(), 0L)))
                .toList();
    }

    private TournamentSummaryResponse toTournamentSummary(Tournament tournament, long teamsCount, long matchesCount) {
        User organizer = tournament.getOrganizer();
        return new TournamentSummaryResponse(tournament.getId(), tournament.getName(), tournament.getSport(),
                tournament.getLocation(), tournament.getStatus(), tournament.getStartDate(), tournament.getEndDate(),
                organizer.getName(), organizer.getEmail(), teamsCount, matchesCount, tournament.getCreatedAt());
    }

    /** JPA providers reject an empty "IN ()" list, so skip the query entirely when there's nothing to count. */
    private <R> Map<Long, Long> countGroupedBy(List<Long> ids, java.util.function.Function<List<Long>, List<R>> query,
                                                java.util.function.Function<R, Long> keyFn,
                                                java.util.function.ToLongFunction<R> countFn) {
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        return query.apply(ids).stream()
                .collect(Collectors.toMap(keyFn, countFn::applyAsLong));
    }
}
