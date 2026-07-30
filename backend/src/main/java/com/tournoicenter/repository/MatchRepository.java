package com.tournoicenter.repository;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByTournamentIdOrderByDateAsc(Long tournamentId);

    long countByTournamentId(Long tournamentId);

    /** Atomic UPDATE rather than a JPA read-modify-write: one goal-tap = one request, and
     *  overlapping taps (double-tap, retry on flaky stadium wifi) must never silently drop a
     *  goal the way a load-then-save race would. Only touches ONGOING matches — the row count
     *  returned (0 or 1) tells the caller whether the match was actually still live.
     *  clearAutomatically: this bypasses the persistence context (native UPDATE), so without it
     *  the caller's very next findById(id) — MatchService.recordGoal re-fetching to build the
     *  response — returns the stale pre-update entity from Hibernate's first-level cache instead
     *  of hitting the DB, making every response lag one goal behind what was just persisted. */
    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE matches SET home_score = GREATEST(0, COALESCE(home_score, 0) + :delta) WHERE id = :id AND status = 'ONGOING'", nativeQuery = true)
    int incrementHomeScore(@Param("id") Long id, @Param("delta") int delta);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE matches SET away_score = GREATEST(0, COALESCE(away_score, 0) + :delta) WHERE id = :id AND status = 'ONGOING'", nativeQuery = true)
    int incrementAwayScore(@Param("id") Long id, @Param("delta") int delta);

    @Query("SELECT m.tournament.id AS tournamentId, COUNT(m) AS count FROM Match m WHERE m.tournament.id IN :tournamentIds GROUP BY m.tournament.id")
    List<TournamentCount> countGroupedByTournamentIdIn(@Param("tournamentIds") List<Long> tournamentIds);

    long countByTournamentOrganizerId(Long organizerId);

    long countByTournamentOrganizerIdAndStatus(Long organizerId, MatchStatus status);

    long countByStatus(MatchStatus status);

    List<Match> findTop10ByTournamentOrganizerIdAndStatusAndDateBetweenOrderByDateAsc(
            Long organizerId, MatchStatus status, Instant from, Instant to);

    /** A team's home/away column can't be expressed as a derived-query "Or" without a
     *  precedence bug (Spring Data applies And/Or left-to-right with no grouping), so this is
     *  the repository's one deliberate use of @Query instead of a derived method name. */
    @Query("""
            SELECT m FROM Match m
            WHERE m.status = :status AND (m.homeTeam.id = :teamId OR m.awayTeam.id = :teamId)
            ORDER BY m.date ASC
            """)
    List<Match> findByTeamIdAndStatusOrderByDateAsc(@Param("teamId") Long teamId, @Param("status") MatchStatus status, Pageable pageable);

    @Query("""
            SELECT m FROM Match m
            WHERE m.status = :status AND (m.homeTeam.id = :teamId OR m.awayTeam.id = :teamId)
            ORDER BY m.date DESC
            """)
    List<Match> findByTeamIdAndStatusOrderByDateDesc(@Param("teamId") Long teamId, @Param("status") MatchStatus status, Pageable pageable);

    interface TournamentCount {
        Long getTournamentId();

        long getCount();
    }
}
