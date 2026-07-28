package com.tournoicenter.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "event_pass_purchases")
public class EventPassPurchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "stripe_checkout_session_id", nullable = false, unique = true)
    private String stripeCheckoutSessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventPassStatus status = EventPassStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "used_at")
    private Instant usedAt;

    protected EventPassPurchase() {
    }

    public EventPassPurchase(User user, String stripeCheckoutSessionId) {
        this.user = user;
        this.stripeCheckoutSessionId = stripeCheckoutSessionId;
        this.status = EventPassStatus.AVAILABLE;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getStripeCheckoutSessionId() {
        return stripeCheckoutSessionId;
    }

    public EventPassStatus getStatus() {
        return status;
    }

    public void setStatus(EventPassStatus status) {
        this.status = status;
    }

    public Tournament getTournament() {
        return tournament;
    }

    public void setTournament(Tournament tournament) {
        this.tournament = tournament;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(Instant usedAt) {
        this.usedAt = usedAt;
    }
}
