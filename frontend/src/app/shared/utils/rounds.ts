import { Match } from '../../core/models/match.model';
import { Team } from '../../core/models/team.model';

export interface Round {
  label: string;
  date: string | null;
  matches: Match[];
  restingTeams: Team[];
}

/** Groups a pool's matches into rounds: every match sharing the exact same `date` timestamp is
 *  one round (the round-robin generator stamps a whole round with a single instant — see
 *  RoundRobinPairing.roundDate on the backend), then lists which of the pool's teams have no
 *  match that round, so a neophyte organizer/spectator can see who's playing and who's resting
 *  at a glance instead of having to read a teams-vs-teams grid. */
export function groupMatchesIntoRounds(matches: Match[], teams: Team[]): Round[] {
  const byDate = new Map<string, Match[]>();
  const order: string[] = [];
  for (const match of [...matches].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.id - b.id)) {
    const key = match.date ?? '';
    if (!byDate.has(key)) {
      byDate.set(key, []);
      order.push(key);
    }
    byDate.get(key)!.push(match);
  }

  return order.map((date, index) => {
    const roundMatches = byDate.get(date)!;
    const playingIds = new Set<number>();
    for (const match of roundMatches) {
      playingIds.add(match.homeTeam.id);
      playingIds.add(match.awayTeam.id);
    }
    return {
      label: `Tour ${index + 1}`,
      date: date || null,
      matches: roundMatches,
      restingTeams: teams.filter((team) => !playingIds.has(team.id)),
    };
  });
}
