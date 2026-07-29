import { Match } from '../../core/models/match.model';
import { Team } from '../../core/models/team.model';

export interface Standing {
  name: string;
  j: number;
  v: number;
  n: number;
  d: number;
  bp: number;
  bc: number;
  pts: number;
  fairPlay: number | null;
}

interface FairPlayTotal {
  sum: number;
  count: number;
}

/** Accepts anything with `teams`/`matches` (not just a full TournamentDetail) so it can be
 *  called once per group with a filtered subset of teams/matches. */
export function computeStandings(tournament: { teams: Team[]; matches: Match[] }): Standing[] {
  const stats: Record<string, Standing> = {};
  const fairPlayTotals: Record<string, FairPlayTotal> = {};
  const emptyStanding = (name: string): Standing => ({ name, j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0, pts: 0, fairPlay: null });
  const addFairPlay = (name: string, note: number | null) => {
    if (note === null) return;
    const total = (fairPlayTotals[name] ??= { sum: 0, count: 0 });
    total.sum += note;
    total.count++;
  };

  tournament.teams.forEach((team) => {
    stats[team.name] = emptyStanding(team.name);
  });

  tournament.matches
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .forEach((m) => {
      const homeName = m.homeTeam.name;
      const awayName = m.awayTeam.name;
      if (!stats[homeName]) stats[homeName] = emptyStanding(homeName);
      if (!stats[awayName]) stats[awayName] = emptyStanding(awayName);

      const homeScore = m.homeScore as number;
      const awayScore = m.awayScore as number;
      stats[homeName].j++;
      stats[awayName].j++;
      stats[homeName].bp += homeScore;
      stats[homeName].bc += awayScore;
      stats[awayName].bp += awayScore;
      stats[awayName].bc += homeScore;
      addFairPlay(homeName, m.homeFairPlay);
      addFairPlay(awayName, m.awayFairPlay);

      if (homeScore > awayScore) {
        stats[homeName].v++;
        stats[homeName].pts += 3;
        stats[awayName].d++;
      } else if (awayScore > homeScore) {
        stats[awayName].v++;
        stats[awayName].pts += 3;
        stats[homeName].d++;
      } else {
        stats[homeName].n++;
        stats[awayName].n++;
        stats[homeName].pts++;
        stats[awayName].pts++;
      }
    });

  Object.values(stats).forEach((standing) => {
    const total = fairPlayTotals[standing.name];
    standing.fairPlay = total ? Math.round((total.sum / total.count) * 10) / 10 : null;
  });

  return Object.values(stats).sort((a, b) => b.pts - a.pts || b.bp - b.bc - (a.bp - a.bc));
}
