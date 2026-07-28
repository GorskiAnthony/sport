package com.tournoicenter.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/** A rung-up sale at the buvette. {@code items} is a JSON snapshot (product name, unit price,
 *  quantity at sale time) rather than a foreign key to BuvetteProduct — a receipt must stay
 *  accurate even after the organizer later renames, re-prices, or deletes the product, the same
 *  way a paper till receipt doesn't change if the menu changes tomorrow. See BuvetteService. */
@Entity
@Table(name = "buvette_sales")
public class BuvetteSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String items;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected BuvetteSale() {
    }

    public BuvetteSale(Tournament tournament, String items, BigDecimal total) {
        this.tournament = tournament;
        this.items = items;
        this.total = total;
    }

    public Long getId() {
        return id;
    }

    public Tournament getTournament() {
        return tournament;
    }

    public String getItems() {
        return items;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
