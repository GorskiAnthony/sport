package com.tournoicenter.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tournaments")
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String sport;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String location;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TournamentStatus status = TournamentStatus.UPCOMING;

    @Column(name = "max_teams", nullable = false)
    private Integer maxTeams = 14;

    @Column
    private String description;

    @Column(columnDefinition = "TEXT")
    private String rules;

    /** Comma-separated terrain/pitch names (e.g. "Terrain A,Terrain B") — deliberately a flat
     *  string rather than a child entity: organizers just need short labels to cycle matches
     *  across, not a managed resource with its own lifecycle. See TerrainAssigner. */
    @Column(columnDefinition = "TEXT")
    private String terrains;

    @Column(name = "sponsor_name")
    private String sponsorName;

    @Column(name = "sponsor_logo_url", columnDefinition = "TEXT")
    private String sponsorLogoUrl;

    @Column(name = "sponsor_click_url", columnDefinition = "TEXT")
    private String sponsorClickUrl;

    @Column(name = "sponsor_clicks", nullable = false)
    private int sponsorClicks = 0;

    @Column
    private String format;

    @Column
    private String icon;

    @Column(name = "split_enabled", nullable = false)
    private boolean splitEnabled = false;

    @Column(name = "event_pass_expires_at")
    private Instant eventPassExpiresAt;

    /** Gate for the "scan to referee" flow (TournamentService.joinAsReferee) — whoever holds
     *  this value can mint themselves a tournament-scoped write session with no account, so it
     *  must never be exposed by a public-read endpoint (see TournamentController's
     *  organizer-only GET /referee-token). Regenerating it invalidates every session minted
     *  from the old value (MatchService.requireCanManage compares against the live column). */
    @Column(name = "referee_join_token", nullable = false, unique = true)
    private String refereeJoinToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Team> teams = new ArrayList<>();

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Match> matches = new ArrayList<>();

    protected Tournament() {
    }

    public Tournament(String name, String sport, String category, String location,
                       LocalDate startDate, LocalDate endDate, Integer maxTeams, User organizer) {
        this.name = name;
        this.sport = sport;
        this.category = category;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.maxTeams = maxTeams;
        this.organizer = organizer;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSport() {
        return sport;
    }

    public void setSport(String sport) {
        this.sport = sport;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public TournamentStatus getStatus() {
        return status;
    }

    public void setStatus(TournamentStatus status) {
        this.status = status;
    }

    public Integer getMaxTeams() {
        return maxTeams;
    }

    public void setMaxTeams(Integer maxTeams) {
        this.maxTeams = maxTeams;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRules() {
        return rules;
    }

    public void setRules(String rules) {
        this.rules = rules;
    }

    public String getTerrains() {
        return terrains;
    }

    public void setTerrains(String terrains) {
        this.terrains = terrains;
    }

    public String getSponsorName() {
        return sponsorName;
    }

    public void setSponsorName(String sponsorName) {
        this.sponsorName = sponsorName;
    }

    public String getSponsorLogoUrl() {
        return sponsorLogoUrl;
    }

    public void setSponsorLogoUrl(String sponsorLogoUrl) {
        this.sponsorLogoUrl = sponsorLogoUrl;
    }

    public String getSponsorClickUrl() {
        return sponsorClickUrl;
    }

    public void setSponsorClickUrl(String sponsorClickUrl) {
        this.sponsorClickUrl = sponsorClickUrl;
    }

    public int getSponsorClicks() {
        return sponsorClicks;
    }

    public void setSponsorClicks(int sponsorClicks) {
        this.sponsorClicks = sponsorClicks;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public boolean isSplitEnabled() {
        return splitEnabled;
    }

    public void setSplitEnabled(boolean splitEnabled) {
        this.splitEnabled = splitEnabled;
    }

    public Instant getEventPassExpiresAt() {
        return eventPassExpiresAt;
    }

    public void setEventPassExpiresAt(Instant eventPassExpiresAt) {
        this.eventPassExpiresAt = eventPassExpiresAt;
    }

    public User getOrganizer() {
        return organizer;
    }

    public String getRefereeJoinToken() {
        return refereeJoinToken;
    }

    public void setRefereeJoinToken(String refereeJoinToken) {
        this.refereeJoinToken = refereeJoinToken;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<Team> getTeams() {
        return teams;
    }

    public List<Match> getMatches() {
        return matches;
    }
}
