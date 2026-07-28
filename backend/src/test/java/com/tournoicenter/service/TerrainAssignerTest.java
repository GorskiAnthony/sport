package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TerrainAssignerTest {

    private Tournament tournamentWithTerrains(String terrains) {
        Tournament tournament = new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), 14, null);
        tournament.setTerrains(terrains);
        return tournament;
    }

    private Match matchAt(Tournament tournament, Instant date) {
        Team home = new Team("Home", "u15", tournament);
        Team away = new Team("Away", "u15", tournament);
        return new Match(tournament, home, away, "Poule unique", date);
    }

    @Test
    void doesNothingWhenNoTerrainsConfigured() {
        Tournament tournament = tournamentWithTerrains(null);
        List<Match> matches = List.of(matchAt(tournament, Instant.parse("2026-08-01T10:00:00Z")));

        TerrainAssigner.assign(tournament, matches);

        assertThat(matches.get(0).getVenue()).isNull();
    }

    @Test
    void cyclesTerrainsWithinTheSameRound() {
        Tournament tournament = tournamentWithTerrains("Terrain A, Terrain B ,Terrain C");
        Instant round1 = Instant.parse("2026-08-01T10:00:00Z");
        List<Match> matches = List.of(
                matchAt(tournament, round1),
                matchAt(tournament, round1),
                matchAt(tournament, round1),
                matchAt(tournament, round1) // 4th match in the round wraps back to the 1st terrain
        );

        TerrainAssigner.assign(tournament, matches);

        assertThat(matches).extracting(Match::getVenue)
                .containsExactly("Terrain A", "Terrain B", "Terrain C", "Terrain A");
    }

    @Test
    void assignsSeparatelyPerRound() {
        Tournament tournament = tournamentWithTerrains("Terrain A,Terrain B");
        Instant round1 = Instant.parse("2026-08-01T10:00:00Z");
        Instant round2 = Instant.parse("2026-08-01T10:20:00Z");
        List<Match> matches = List.of(
                matchAt(tournament, round1),
                matchAt(tournament, round2)
        );

        TerrainAssigner.assign(tournament, matches);

        // Each round restarts the cycle at the first terrain, since every round only has one match here.
        assertThat(matches).extracting(Match::getVenue).containsExactly("Terrain A", "Terrain A");
    }

    @Test
    void parseTerrainsTrimsAndDropsBlankEntries() {
        assertThat(TerrainAssigner.parseTerrains(" Terrain A ,, Terrain B,"))
                .containsExactly("Terrain A", "Terrain B");
        assertThat(TerrainAssigner.parseTerrains(null)).isEmpty();
        assertThat(TerrainAssigner.parseTerrains("   ")).isEmpty();
    }
}
