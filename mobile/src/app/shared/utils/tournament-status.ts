import { TournamentStatus } from '../../core/models/tournament.model';

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  UPCOMING: 'À venir',
  ONGOING: 'En cours',
  FINISHED: 'Terminé',
};

// Couleurs Ionic thémées avec la palette du design-system : primary = vert (ongoing/live),
// warning = ambre (à venir), medium = gris/slate (terminé). Voir .claude/skills/design-system.
export const TOURNAMENT_STATUS_COLORS: Record<TournamentStatus, 'primary' | 'warning' | 'danger' | 'medium'> = {
  UPCOMING: 'warning',
  ONGOING: 'primary',
  FINISHED: 'medium',
};
