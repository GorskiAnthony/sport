import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { MatchService } from '../../core/services/match.service';
import { LiveUpdateService } from '../../core/services/live-update.service';
import { Match, MatchStatus } from '../../core/models/match.model';

const STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'À venir',
  ONGOING: 'En direct',
  FINISHED: 'Terminé',
  FORFEIT: 'Forfait',
};

// Même mapping que frontend/src/app/shared/ui/status-badge — voir .claude/skills/design-system.
const STATUS_COLORS: Record<MatchStatus, string> = {
  SCHEDULED: 'warning',
  ONGOING: 'primary',
  FINISHED: 'medium',
  FORFEIT: 'danger',
};

@Component({
  selector: 'app-live-score',
  templateUrl: './live-score.page.html',
  styleUrls: ['./live-score.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonText,
  ],
})
export class LiveScorePage implements ViewWillEnter, ViewWillLeave {
  private readonly route = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);
  private readonly liveUpdateService = inject(LiveUpdateService);

  // Pas readonly / pas résolu au constructeur : Angular réutilise l'instance de ce composant en
  // navigant d'un tournoi vers un autre (même route paramétrée /tournaments/:id/live), donc
  // route.snapshot ne doit être relu qu'au moment de l'entrée réelle sur l'écran.
  private tournamentId!: number;
  private unsubscribeLive: (() => void) | null = null;

  readonly matches = signal<Match[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  // Ionic met en cache l'instance de la page pour l'animation de retour plutôt que de la
  // détruire/recréer (ngOnInit/ngOnDestroy ne se redéclenchent pas de façon fiable) — on
  // s'abonne/désabonne au WebSocket en symétrie avec l'entrée/sortie réelle de l'écran.
  ionViewWillEnter(): void {
    this.tournamentId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    // Le backend pousse un événement "UPDATED" à chaque changement de score (voir
    // TournamentLiveService côté backend) — on recharge simplement la liste des matchs plutôt
    // que d'essayer de fusionner un diff partiel.
    this.unsubscribeLive = this.liveUpdateService.subscribeToTournament(this.tournamentId, () => this.load());
  }

  ionViewWillLeave(): void {
    this.unsubscribeLive?.();
    this.unsubscribeLive = null;
  }

  statusLabel(status: MatchStatus): string {
    return STATUS_LABELS[status];
  }

  statusColor(status: MatchStatus): string {
    return STATUS_COLORS[status];
  }

  load(): void {
    this.matchService.getByTournament(this.tournamentId).subscribe({
      next: (matches) => {
        this.matches.set(matches);
        this.loading.set(false);
        this.error.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}
