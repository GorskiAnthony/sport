import { MatchStatus } from '../../core/models/match.model';
import { TournamentStatus } from '../../core/models/tournament.model';

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  UPCOMING: 'À venir',
  ONGOING: 'En cours',
  FINISHED: 'Terminé',
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'À venir',
  ONGOING: 'En cours',
  FINISHED: 'Terminé',
};

export const SPORT_ICONS: Record<string, string> = {
  football: '⚽',
  futsal: '⚽',
  basketball: '🏀',
  handball: '🤾',
  volleyball: '🏐',
  rugby: '🏉',
  tennis: '🎾',
  esport: '🎮',
};
