import { Team } from './team.model';

// Sous-ensemble de frontend/src/app/core/models/match.model.ts — seuls les champs affichés dans
// l'écran de score en direct et les écrans arbitre.
export type MatchStatus = 'SCHEDULED' | 'ONGOING' | 'FINISHED' | 'FORFEIT';

export interface Match {
  id: number;
  tournamentId: number;
  tournamentName: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  forfeitedTeamId: number | null;
  refereeId: number | null;
  phase: string | null;
  date: string | null;
  venue: string | null;
  status: MatchStatus;
}

export interface MatchScoreRequest {
  homeScore: number;
  awayScore: number;
}
