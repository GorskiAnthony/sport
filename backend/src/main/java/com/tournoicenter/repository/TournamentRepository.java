package com.tournoicenter.repository;

import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.TournamentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findAllByOrderByStartDateDesc();

    List<Tournament> findByOrganizerIdOrderByCreatedAtDesc(Long organizerId);

    long countByOrganizerId(Long organizerId);

    long countByOrganizerIdAndStatus(Long organizerId, TournamentStatus status);
}
