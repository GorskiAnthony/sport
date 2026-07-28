package com.tournoicenter.repository;

import com.tournoicenter.domain.BuvetteProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BuvetteProductRepository extends JpaRepository<BuvetteProduct, Long> {
    List<BuvetteProduct> findByTournamentIdOrderByNameAsc(Long tournamentId);
}
