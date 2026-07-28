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
  rules: string | null;
  teams: Team[];
  matches: Match[];
}

export interface RecentTournament {
  tournament: TournamentSummary;
  firstViewedAt: string;
  lastViewedAt: string;
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
  rules?: string;
  format?: string;
  splitEnabled?: boolean;
  useEventPass?: boolean;
}
