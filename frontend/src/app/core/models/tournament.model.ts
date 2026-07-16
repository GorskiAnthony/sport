import { Match } from './match.model';
import { Team } from './team.model';

export type TournamentStatus = 'UPCOMING' | 'ONGOING' | 'FINISHED';

export interface TournamentSummary {
  id: number;
  name: string;
  sport: string;
  category: string;
  location: string | null;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  maxTeams: number;
  description: string | null;
  format: string | null;
  icon: string | null;
  splitEnabled: boolean;
  organizerId: number;
  teamsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentDetail
  extends Omit<TournamentSummary, 'teamsCount'> {
  teams: Team[];
  matches: Match[];
}

export interface TournamentRequest {
  name: string;
  sport: string;
  category: string;
  location?: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  description?: string;
  format?: string;
  splitEnabled?: boolean;
}
