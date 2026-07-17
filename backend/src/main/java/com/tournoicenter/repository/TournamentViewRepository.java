package com.tournoicenter.repository;

import com.tournoicenter.domain.TournamentView;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TournamentViewRepository extends JpaRepository<TournamentView, Long> {
    Optional<TournamentView> findByUserIdAndTournamentId(Long userId, Long tournamentId);

    List<TournamentView> findTop10ByUserIdOrderByLastViewedAtDesc(Long userId);
}
