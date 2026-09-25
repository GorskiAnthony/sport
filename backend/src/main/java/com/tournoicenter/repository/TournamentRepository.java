package com.tournoicenter.repository;

import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findAllByOrderByStartDateDesc();

    List<Tournament> findByOrganizerIdOrderByCreatedAtDesc(Long organizerId);

    Optional<Tournament> findByRefereeJoinToken(String refereeJoinToken);

    long countByOrganizerId(Long organizerId);

    long countByOrganizerIdAndStatus(Long organizerId, TournamentStatus status);

    long countByStatus(TournamentStatus status);

    @Query("SELECT t.organizer.id AS organizerId, COUNT(t) AS count FROM Tournament t WHERE t.organizer.id IN :organizerIds GROUP BY t.organizer.id")
    List<OrganizerCount> countGroupedByOrganizerIdIn(@Param("organizerIds") List<Long> organizerIds);

    @Query("""
            SELECT t FROM Tournament t
            WHERE (:query IS NULL
                OR LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(t.location) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(t.organizer.email) LIKE LOWER(CONCAT('%', :query, '%')))
              AND (:status IS NULL OR t.status = :status)
            ORDER BY t.createdAt DESC
            """)
    List<Tournament> search(@Param("query") String query, @Param("status") TournamentStatus status, Pageable pageable);

    /** Public counterpart to search() above — deliberately does NOT match on organizer.email:
     *  this backs the unauthenticated /api/tournaments list, and matching on email would let
     *  anyone probe whether a given address belongs to an organizer (a search that returns
     *  results vs. one that doesn't is itself a leak), which the admin-only search doesn't need
     *  to worry about. */
    @Query("""
            SELECT t FROM Tournament t
            WHERE (:query IS NULL
                OR LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(t.location) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(t.sport) LIKE LOWER(CONCAT('%', :query, '%')))
            ORDER BY t.startDate DESC
            """)
    List<Tournament> searchPublic(@Param("query") String query);

    @Query("SELECT t.location AS location, COUNT(t) AS count FROM Tournament t GROUP BY t.location ORDER BY COUNT(t) DESC")
    List<LocationCount> countGroupedByLocation(Pageable pageable);

    @Query(value = """
            SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS count
            FROM tournaments
            WHERE created_at >= :since
            GROUP BY day
            ORDER BY day
            """, nativeQuery = true)
    List<DailyCount> countCreatedSince(@Param("since") Instant since);

    interface LocationCount {
        String getLocation();

        long getCount();
    }

    interface OrganizerCount {
        Long getOrganizerId();

        long getCount();
    }

    interface DailyCount {
        LocalDate getDay();

        long getCount();
    }
}
