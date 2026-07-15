import { TournamentDetail } from '../../core/models/tournament.model';

export interface Standing {
  name: string;
  j: number;
  v: number;
  n: number;
  d: number;
  bp: number;
  bc: number;
  pts: number;
}

export function computeStandings(tournament: TournamentDetail): Standing[] {
  const stats: Record<string, Standing> = {};
  tournament.teams.forEach((team) => {
    stats[team.name] = { name: team.name, j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0, pts: 0 };
  });

  tournament.matches
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .forEach((m) => {
      const homeName = m.homeTeam.name;
      const awayName = m.awayTeam.name;
      if (!stats[homeName]) stats[homeName] = { name: homeName, j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0, pts: 0 };
      if (!stats[awayName]) stats[awayName] = { name: awayName, j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0, pts: 0 };

      const homeScore = m.homeScore as number;
      const awayScore = m.awayScore as number;
      stats[homeName].j++;
      stats[awayName].j++;
      stats[homeName].bp += homeScore;
      stats[homeName].bc += awayScore;
      stats[awayName].bp += awayScore;
      stats[awayName].bc += homeScore;

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

  return Object.values(stats).sort((a, b) => b.pts - a.pts || b.bp - b.bc - (a.bp - a.bc));
}
