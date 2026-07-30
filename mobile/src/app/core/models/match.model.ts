import { Team } from './team.model';

// Sous-ensemble de frontend/src/app/core/models/match.model.ts — seuls les champs affichés dans
// l'écran de score en direct.
export type MatchStatus = 'SCHEDULED' | 'ONGOING' | 'FINISHED' | 'FORFEIT';

export interface Match {
  id: number;
  tournamentId: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  forfeitedTeamId: number | null;
  phase: string | null;
  status: MatchStatus;
}
