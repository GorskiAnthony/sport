package com.tournoicenter.repository;

import com.tournoicenter.domain.EventPassPurchase;
import com.tournoicenter.domain.EventPassStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventPassPurchaseRepository extends JpaRepository<EventPassPurchase, Long> {
    Optional<EventPassPurchase> findFirstByUserIdAndStatusOrderByCreatedAtAsc(Long userId, EventPassStatus status);

    Optional<EventPassPurchase> findByStripeCheckoutSessionId(String stripeCheckoutSessionId);

    boolean existsByUserIdAndStatus(Long userId, EventPassStatus status);
}
