package com.tournoicenter.repository;

import com.tournoicenter.domain.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByUserId(Long userId);

    Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);
}
