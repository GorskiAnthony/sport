import { Match } from './match.model';
import { Team } from './team.model';

export type TournamentFormat = 'ROUND_ROBIN' | 'SINGLE_ELIMINATION' | 'GROUP_KNOCKOUT';

export interface BracketAdvanceResponse {
  matches: Match[];
  tournamentComplete: boolean;
  champion: Team | null;
}
