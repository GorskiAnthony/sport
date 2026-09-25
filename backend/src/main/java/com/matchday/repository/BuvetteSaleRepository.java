package com.matchday.repository;

import com.matchday.domain.BuvetteSale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BuvetteSaleRepository extends JpaRepository<BuvetteSale, Long> {
    List<BuvetteSale> findByTournamentIdOrderByCreatedAtDesc(Long tournamentId);
}
