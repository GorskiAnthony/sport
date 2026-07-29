import { Team } from './team.model';

export type MatchStatus = 'SCHEDULED' | 'ONGOING' | 'FINISHED' | 'FORFEIT';

export interface Match {
  id: number;
  tournamentId: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  homeFairPlay: number | null;
  awayFairPlay: number | null;
  forfeitedTeamId: number | null;
  phase: string | null;
  date: string | null;
  venue: string | null;
  status: MatchStatus;
  events: string | null;
  stats: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchRequest {
  tournamentId: number;
  homeTeamId: number;
  awayTeamId: number;
  phase: string;
  date: string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
}

export interface MatchScoreRequest {
  homeScore: number;
  awayScore: number;
  homeFairPlay?: number;
  awayFairPlay?: number;
}
