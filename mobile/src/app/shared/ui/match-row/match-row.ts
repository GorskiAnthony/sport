import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatchStatus } from '../../../core/models/match.model';
import { MATCH_STATUS_COLORS, MATCH_STATUS_LABELS } from '../../utils/match-status';
import { StatusBadgeComponent } from '../status-badge/status-badge';

/** Ligne de score compacte (équipe / score ou "vs" en font-mono / équipe), avec phase et badge
 *  de statut optionnels — remplace les grilles .match-row/.match-line dupliquées dans
 *  tournament-detail.page.html (tours de poule/phases finales) et live-score.page.html. */
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

  get statusLabel(): string {
    const status = this.status();
    return status ? MATCH_STATUS_LABELS[status] : '';
  }

  get statusColor(): 'primary' | 'warning' | 'danger' | 'medium' {
    const status = this.status();
    return status ? MATCH_STATUS_COLORS[status] : 'medium';
  }
}
