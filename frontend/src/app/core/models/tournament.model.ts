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
  eventPassExpiresAt: string | null;
  organizerId: number;
  teamsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentDetail
  extends Omit<TournamentSummary, 'teamsCount'> {
  rules: string | null;
  terrains: string | null;
  sponsorName: string | null;
  sponsorLogoUrl: string | null;
  sponsorClickUrl: string | null;
  sponsorClicks: number;
  teams: Team[];
  matches: Match[];
}

export interface RecentTournament {
  tournament: TournamentSummary;
  firstViewedAt: string;
  lastViewedAt: string;
}

export interface RefereeJoinInfo {
  token: string;
  joinUrl: string;
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
  terrains?: string;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  sponsorClickUrl?: string;
  format?: string;
  splitEnabled?: boolean;
  useEventPass?: boolean;
}
