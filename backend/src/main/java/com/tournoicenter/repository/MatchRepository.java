package com.tournoicenter.repository;

import com.tournoicenter.domain.Match;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByTournamentIdOrderByDateAsc(Long tournamentId);
}
