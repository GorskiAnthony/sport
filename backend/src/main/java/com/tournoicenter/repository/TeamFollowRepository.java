package com.tournoicenter.repository;

import com.tournoicenter.domain.TeamFollow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamFollowRepository extends JpaRepository<TeamFollow, Long> {
    Optional<TeamFollow> findByUserIdAndTeamId(Long userId, Long teamId);

    List<TeamFollow> findByTeamId(Long teamId);

    List<TeamFollow> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndTeamId(Long userId, Long teamId);
}
