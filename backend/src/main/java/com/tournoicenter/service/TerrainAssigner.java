package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Tournament;

import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Cycles matches within each round across the organizer's declared terrains, so a round's
 *  parallel matches (already grouped by identical {@code Match.date} — see RoundRobinPairing and
 *  SingleEliminationGenerator, which stamp every match in a round with the same instant) map to
 *  different pitches instead of leaving every match's venue blank. A no-op when the organizer
 *  hasn't configured any terrain. */
public final class TerrainAssigner {

    private TerrainAssigner() {
    }

    public static void assign(Tournament tournament, List<Match> matches) {
        List<String> terrains = parseTerrains(tournament.getTerrains());
        if (terrains.isEmpty()) {
            return;
        }

        Map<Instant, List<Match>> byRound = matches.stream()
                .collect(Collectors.groupingBy(Match::getDate, LinkedHashMap::new, Collectors.toList()));
        for (List<Match> round : byRound.values()) {
            for (int i = 0; i < round.size(); i++) {
                round.get(i).setVenue(terrains.get(i % terrains.size()));
            }
        }
    }

    public static List<String> parseTerrains(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
