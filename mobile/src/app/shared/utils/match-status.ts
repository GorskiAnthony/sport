import { MatchStatus } from '../../core/models/match.model';

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'À venir',
  ONGOING: 'En cours',
  FINISHED: 'Terminé',
  FORFEIT: 'Forfait',
};

// Même mapping que frontend/src/app/shared/ui/status-badge — voir .claude/skills/design-system.
export const MATCH_STATUS_COLORS: Record<MatchStatus, 'primary' | 'warning' | 'danger' | 'medium'> = {
  SCHEDULED: 'warning',
  ONGOING: 'primary',
  FINISHED: 'medium',
  FORFEIT: 'danger',
};
