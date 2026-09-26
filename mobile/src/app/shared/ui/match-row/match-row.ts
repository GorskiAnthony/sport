import { ChangeDetectionStrategy, Component, EventEmitter, Output, effect, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatchStatus } from '../../../core/models/match.model';
import { MATCH_STATUS_COLORS, MATCH_STATUS_LABELS } from '../../utils/match-status';
import { hapticTap } from '../../utils/haptics';
import { StatusBadgeComponent } from '../status-badge/status-badge';

const ANIMATION_DURATION_MS = 600;

/** Ligne de score compacte (équipe / score ou "vs" en font-mono / équipe), avec phase et badge
 *  de statut optionnels — remplace les grilles .match-row/.match-line dupliquées dans
 *  tournament-detail.page.html (tours de poule/phases finales) et live-score.page.html. Le score
 *  affiché s'anime du dernier total connu (0 au premier rendu) vers le nouveau à chaque
 *  changement — révélation à l'affichage initial, incrément visible lors d'une mise à jour live
 *  (voir LiveUpdateService côté live-score.page.ts). */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-match-row',
  standalone: true,
  templateUrl: './match-row.html',
  styleUrls: ['./match-row.scss'],
  imports: [NgTemplateOutlet, StatusBadgeComponent],
})
export class MatchRowComponent {
  readonly homeTeamName = input.required<string>();
  readonly awayTeamName = input.required<string>();
  readonly homeScore = input<number | null>(null);
  readonly awayScore = input<number | null>(null);
  readonly status = input<MatchStatus | undefined>(undefined);
  readonly phase = input<string | null>(null);
  readonly showStatusBadge = input(false);
  readonly clickable = input(false);

  @Output() readonly rowClick = new EventEmitter<void>();

  readonly animatedHomeScore = signal(0);
  readonly animatedAwayScore = signal(0);

  private lastHome = 0;
  private lastAway = 0;
  private animationFrame: number | null = null;

  get statusLabel(): string {
    const status = this.status();
    return status ? MATCH_STATUS_LABELS[status] : '';
  }

  get statusColor(): 'primary' | 'warning' | 'danger' | 'medium' {
    const status = this.status();
    return status ? MATCH_STATUS_COLORS[status] : 'medium';
  }

  constructor() {
    effect(() => {
      const home = this.homeScore();
      const away = this.awayScore();
      if (home === null || away === null || this.status() === 'FORFEIT') return;

      this.animateTo(home, away);
      this.lastHome = home;
      this.lastAway = away;
    });
  }

  onRowClick(): void {
    hapticTap();
    this.rowClick.emit();
  }

  private animateTo(toHome: number, toAway: number): void {
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);

    const fromHome = this.lastHome;
    const fromAway = this.lastAway;
    if (fromHome === toHome && fromAway === toAway) {
      this.animatedHomeScore.set(toHome);
      this.animatedAwayScore.set(toAway);
      return;
    }

    const start = performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / ANIMATION_DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      this.animatedHomeScore.set(Math.round(fromHome + (toHome - fromHome) * eased));
      this.animatedAwayScore.set(Math.round(fromAway + (toAway - fromAway) * eased));
      this.animationFrame = t < 1 ? requestAnimationFrame(step) : null;
    };
    this.animationFrame = requestAnimationFrame(step);
  }
}
