import { Match } from './match.model';

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

export interface PlanUsage {
  plan: 'FREE' | 'CLASSIC' | 'PRO';
  usedTournaments: number;
  maxTournaments: number;
  maxTeamsPerTournament: number;
  realtimeEnabled: boolean;
  customRulesEnabled: boolean;
}

export interface OrganizerDashboardStats {
  tournaments: TournamentStatusCounts;
  teamsCount: number;
  matches: MatchStatusCounts;
  plan: PlanUsage;
  upcomingMatches: Match[];
}
