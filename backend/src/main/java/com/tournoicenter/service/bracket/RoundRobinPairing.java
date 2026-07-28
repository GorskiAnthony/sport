package com.tournoicenter.service.bracket;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/** Shared "everybody plays everybody once" pairing, used by both RoundRobinGenerator (single
 *  pool) and GroupKnockoutGenerator (one pool per group).
 *
 *  Pairs are generated with the "circle method": one team stays fixed, the others rotate one
 *  seat per round, and each round pairs up opposite seats. This spreads every team's matches as
 *  evenly as possible across rounds — the naive i-vs-j nested-loop order it replaces made the
 *  first team in the list play several matches in a row with zero rest while later teams sat
 *  idle for most of the day, which falls apart for single-day tournaments (e.g. U9 categories
 *  played entirely in one day) where fair rest and a smooth back-to-back flow matter most. An
 *  odd team count gets a "bye" seat that rotates like any other, so each team sits out exactly
 *  once instead of always the same team. */
final class RoundRobinPairing {

    /** Assumed match length used to space consecutive rounds on a single-day tournament so a
     *  team's next match never overlaps the previous one. Organizers can still edit each match's
     *  date/time afterward — this only seeds a sane, evenly-rested starting schedule. */
    private static final int ROUND_SLOT_MINUTES = 20;
    private static final int DAY_START_HOUR = 10;

    private RoundRobinPairing() {
    }

    static List<Match> pairEveryTeamOnce(Tournament tournament, List<Team> teams, String phaseLabel) {
        List<List<Team[]>> rounds = circleMethodRounds(teams);
        return toMatches(tournament, List.of(rounds), List.of(phaseLabel), rounds.size());
    }

    /** One round-robin pool per group, all sharing the same round-by-round time slots — so
     *  "Groupe A" round 1 and "Groupe B" round 1 kick off together, the whole point of running
     *  several pools in parallel on different pitches during a single-day event. A group with
     *  fewer rounds than the largest one (uneven group sizes) simply has no match in the slots
     *  beyond its own round count. */
    static List<Match> pairAllGroups(Tournament tournament, List<List<Team>> groups, List<String> phaseLabels) {
        List<List<List<Team[]>>> roundsByGroup = new ArrayList<>(groups.size());
        int maxRounds = 0;
        for (List<Team> group : groups) {
            List<List<Team[]>> rounds = circleMethodRounds(group);
            roundsByGroup.add(rounds);
            maxRounds = Math.max(maxRounds, rounds.size());
        }
        return toMatches(tournament, roundsByGroup, phaseLabels, maxRounds);
    }

    private static List<Match> toMatches(Tournament tournament, List<List<List<Team[]>>> roundsByGroup,
                                          List<String> phaseLabels, int totalRounds) {
        List<Match> matches = new ArrayList<>();
        for (int round = 0; round < totalRounds; round++) {
            Instant date = roundDate(tournament, round, totalRounds);
            for (int g = 0; g < roundsByGroup.size(); g++) {
                List<List<Team[]>> groupRounds = roundsByGroup.get(g);
                if (round >= groupRounds.size()) continue;
                for (Team[] pair : groupRounds.get(round)) {
                    matches.add(new Match(tournament, pair[0], pair[1], phaseLabels.get(g), date));
                }
            }
        }
        return matches;
    }

    /** Circle method: seat 0 stays fixed, every other seat rotates by one position each round,
     *  and each round pairs up opposite seats (0 vs last, 1 vs second-to-last, ...). An odd team
     *  count gets a null "bye" seat that rotates through every position exactly once, so byes
     *  land on a different team each round. */
    private static List<List<Team[]>> circleMethodRounds(List<Team> teams) {
        List<Team> seats = new ArrayList<>(teams);
        if (seats.size() % 2 != 0) {
            seats.add(null);
        }
        int seatCount = seats.size();
        int totalRounds = seatCount - 1;

        List<List<Team[]>> rounds = new ArrayList<>(totalRounds);
        for (int round = 0; round < totalRounds; round++) {
            List<Team[]> pairs = new ArrayList<>(seatCount / 2);
            for (int i = 0; i < seatCount / 2; i++) {
                Team home = seats.get(i);
                Team away = seats.get(seatCount - 1 - i);
                if (home != null && away != null) {
                    pairs.add(new Team[]{home, away});
                }
            }
            rounds.add(pairs);

            Team last = seats.remove(seatCount - 1);
            seats.add(1, last);
        }
        return rounds;
    }

    private static Instant roundDate(Tournament tournament, int round, int totalRounds) {
        LocalDate start = tournament.getStartDate();
        LocalDate end = tournament.getEndDate();
        long spanDays = ChronoUnit.DAYS.between(start, end);

        if (spanDays <= 0 || totalRounds <= 1) {
            return start.atTime(DAY_START_HOUR, 0).plusMinutes((long) round * ROUND_SLOT_MINUTES).toInstant(ZoneOffset.UTC);
        }

        long dayOffset = Math.round((double) round / totalRounds * spanDays);
        return start.plusDays(dayOffset).atTime(DAY_START_HOUR, 0).toInstant(ZoneOffset.UTC);
    }
}
