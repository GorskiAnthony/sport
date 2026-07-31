import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusBadgeColor = 'primary' | 'warning' | 'danger' | 'medium';

/** Pastille de statut teintée (fond à 20% d'opacité + texte plein de la même teinte) — même
 *  langage visuel que frontend/src/app/shared/ui/status-badge (voir .claude/skills/design-system).
 *  Remplace le rendu "plein" par défaut de ion-badge, utilisé pour les statuts de tournoi et de
 *  match (mêmes noms de couleur Ionic dans les deux cas, voir shared/utils/tournament-status.ts
 *  et shared/utils/match-status.ts). */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.html',
  styleUrls: ['./status-badge.scss'],
})
export class StatusBadgeComponent {
  readonly color = input.required<StatusBadgeColor>();
  readonly label = input.required<string>();
}
