import { Match } from './match.model';
import { TournamentStatus } from './tournament.model';

export interface Team {
  id: number;
  name: string;
  club: string | null;
  logo: string | null;
  category: string;
  contact: string | null;
  tournamentId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamRequest {
  name: string;
  club?: string;
  logo?: string;
  category: string;
  contact?: string;
  tournamentId: number;
}

export interface FollowedTeam {
  team: Team;
  tournamentName: string;
  tournamentStatus: TournamentStatus;
  nextMatch: Match | null;
  lastMatch: Match | null;
}
