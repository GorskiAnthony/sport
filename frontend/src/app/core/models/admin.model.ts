import { Role, Plan } from './user.model';
import { TournamentStatus } from './tournament.model';

export interface TournamentStatusCounts {
  total: number;
  upcoming: number;
  ongoing: number;
  finished: number;
}

export interface MatchStatusCounts {
  total: number;
  scheduled: number;
  ongoing: number;
  finished: number;
}

export interface UserCounts {
  total: number;
  organizers: number;
  spectators: number;
  admins: number;
}

export interface PlanCount {
  plan: Plan;
  count: number;
}

export interface GrowthPoint {
  date: string;
  count: number;
}

export interface AdminOverview {
  users: UserCounts;
  tournaments: TournamentStatusCounts;
  matches: MatchStatusCounts;
  totalTeams: number;
  planBreakdown: PlanCount[];
  signups30d: GrowthPoint[];
  tournamentsCreated30d: GrowthPoint[];
}

export interface AdminUserSummary {
  id: number;
  name: string;
  email: string;
  role: Role;
  plan: Plan;
  createdAt: string;
  tournamentsCount: number;
}

export interface AdminTournamentSummary {
  id: number;
  name: string;
  sport: string;
  location: string | null;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  organizerName: string;
  organizerEmail: string;
  teamsCount: number;
  matchesCount: number;
  createdAt: string;
}

export interface AdminUserDetail {
  id: number;
  name: string;
  email: string;
  role: Role;
  plan: Plan;
  createdAt: string;
  subscriptionStatus: string | null;
  tournaments: AdminTournamentSummary[];
}

export interface AdminLocationStats {
  location: string;
  tournamentsCount: number;
}
