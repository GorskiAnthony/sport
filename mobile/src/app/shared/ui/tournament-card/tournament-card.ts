import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCodeOutline, chevronForwardOutline } from 'ionicons/icons';
import { TournamentSummary } from '../../../core/models/tournament.model';
import { TOURNAMENT_STATUS_COLORS, TOURNAMENT_STATUS_LABELS } from '../../utils/tournament-status';
import { SPORTS } from '../../utils/sports';
import { StatusBadgeComponent } from '../status-badge/status-badge';

/** Carte de tournoi pour la liste organisateur — remplace la ligne ion-item par défaut. Icône
 *  sport en emoji (même logique que frontend/src/app/shared/ui/sport-icon : lookup par id,
 *  🏆 par défaut si le sport n'est pas reconnu), badge de statut teinté, accès rapide au code
 *  arbitre sans déclencher la navigation vers le détail (voir onRefereeCodeClick). */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tournament-card',
  standalone: true,
  templateUrl: './tournament-card.html',
  styleUrls: ['./tournament-card.scss'],
  imports: [IonIcon, StatusBadgeComponent],
})
export class TournamentCardComponent {
  readonly tournament = input.required<TournamentSummary>();

  @Output() readonly open = new EventEmitter<void>();
  @Output() readonly openRefereeCode = new EventEmitter<void>();

  readonly sportIcon = computed(() => SPORTS.find((s) => s.id === this.tournament().sport)?.icon ?? '🏆');
  readonly statusLabel = computed(() => TOURNAMENT_STATUS_LABELS[this.tournament().status]);
  readonly statusColor = computed(() => TOURNAMENT_STATUS_COLORS[this.tournament().status]);

  constructor() {
    addIcons({ qrCodeOutline, chevronForwardOutline });
  }

  onRefereeCodeClick(event: Event): void {
    event.stopPropagation();
    this.openRefereeCode.emit();
  }
}
