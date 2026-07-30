package com.tournoicenter.repository;

import com.tournoicenter.domain.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByTournamentIdOrderByNameAsc(Long tournamentId);

    long countByTournamentId(Long tournamentId);

    long countByTournamentOrganizerId(Long organizerId);

    @Query("SELECT t.tournament.id AS tournamentId, COUNT(t) AS count FROM Team t WHERE t.tournament.id IN :tournamentIds GROUP BY t.tournament.id")
    List<TournamentCount> countGroupedByTournamentIdIn(@Param("tournamentIds") List<Long> tournamentIds);

    interface TournamentCount {
        Long getTournamentId();

        long getCount();
    }
}
