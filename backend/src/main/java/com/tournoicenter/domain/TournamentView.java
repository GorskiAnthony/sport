package com.tournoicenter.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Records that a spectator has visited a tournament's public page, deduplicated per
 *  (user, tournament) pair — {@code lastViewedAt} is bumped via {@link #touch()} on every
 *  repeat visit rather than relying on Hibernate's dirty-checking (which would skip the
 *  UPDATE on a repeat visit where no other field changes). */
@Entity
@Table(name = "tournament_views", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "tournament_id"}))
public class TournamentView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @CreationTimestamp
    @Column(name = "first_viewed_at", nullable = false, updatable = false)
    private Instant firstViewedAt;

    @Column(name = "last_viewed_at", nullable = false)
    private Instant lastViewedAt;

    protected TournamentView() {
    }

    public TournamentView(User user, Tournament tournament) {
        this.user = user;
        this.tournament = tournament;
        this.lastViewedAt = Instant.now();
    }

    public void touch() {
        this.lastViewedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Tournament getTournament() {
        return tournament;
    }

    public Instant getFirstViewedAt() {
        return firstViewedAt;
    }

    public Instant getLastViewedAt() {
        return lastViewedAt;
    }
}
