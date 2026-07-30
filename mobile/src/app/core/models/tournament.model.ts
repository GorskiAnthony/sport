import { Match } from './match.model';
import { Team } from './team.model';

// Sous-ensemble de frontend/src/app/core/models/tournament.model.ts — la gestion de tournoi
// (création, édition, équipes, tableau) est portée sur mobile, mais pas les champs PRO
// (règlement personnalisé, sponsor) ni l'Event Pass — voir le plan de portage.
export type TournamentStatus = 'UPCOMING' | 'ONGOING' | 'FINISHED';
export type TournamentFormat = 'ROUND_ROBIN' | 'SINGLE_ELIMINATION' | 'GROUP_KNOCKOUT';

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
  teamsCount: number;
  format: TournamentFormat | null;
}

export interface TournamentDetail extends Omit<TournamentSummary, 'teamsCount'> {
  description: string | null;
  terrains: string | null;
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
  terrains?: string;
  format?: TournamentFormat;
}

export interface BracketAdvanceResponse {
  matches: Match[];
  tournamentComplete: boolean;
  champion: Team | null;
}

/** token n'est renvoyé qu'à l'organisateur du tournoi — voir TournamentController côté
 *  backend, GET/POST .../referee-token(/regenerate). */
export interface RefereeJoinInfo {
  token: string;
  joinUrl: string;
}
