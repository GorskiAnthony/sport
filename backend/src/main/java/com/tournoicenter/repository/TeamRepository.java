package com.tournoicenter.repository;

import com.tournoicenter.domain.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByTournamentIdOrderByNameAsc(Long tournamentId);

    long countByTournamentId(Long tournamentId);
}
