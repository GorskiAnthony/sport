package com.tournoicenter.repository;

import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByStripeId(String stripeId);

    long countByRole(Role role);

    List<User> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
            ORDER BY u.createdAt DESC
            """)
    List<User> search(@Param("query") String query, Pageable pageable);

    @Query("SELECT u.plan AS plan, COUNT(u) AS count FROM User u GROUP BY u.plan")
    List<PlanCount> countGroupedByPlan();

    @Query(value = """
            SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS count
            FROM users
            WHERE created_at >= :since
            GROUP BY day
            ORDER BY day
            """, nativeQuery = true)
    List<DailyCount> countSignupsSince(@Param("since") Instant since);

    interface PlanCount {
        Plan getPlan();

        long getCount();
    }

    interface DailyCount {
        LocalDate getDay();

        long getCount();
    }
}
