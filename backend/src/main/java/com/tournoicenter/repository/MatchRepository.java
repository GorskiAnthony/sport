package com.tournoicenter.repository;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByTournamentIdOrderByDateAsc(Long tournamentId);

    long countByTournamentOrganizerId(Long organizerId);

    long countByTournamentOrganizerIdAndStatus(Long organizerId, MatchStatus status);

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
}
