import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonContent,
  IonSpinner,
  IonText,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, cloudOfflineOutline } from 'ionicons/icons';
import { MatchService } from '../../core/services/match.service';
import { ConnectivityService } from '../../core/services/connectivity.service';
import { ScoreQueueService } from '../../core/services/score-queue.service';
import { Match, MatchStatus, TeamSide } from '../../core/models/match.model';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { MATCH_STATUS_COLORS, MATCH_STATUS_LABELS } from '../../shared/utils/match-status';
import { hapticSuccess, hapticTap } from '../../shared/utils/haptics';
import { BreadcrumbComponent, BreadcrumbSegment } from '../../shared/ui/breadcrumb/breadcrumb';

@Component({
  selector: 'app-match-detail',
  templateUrl: './match-detail.page.html',
  styleUrls: ['./match-detail.page.scss'],
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonSpinner,
    IonText,
    StatusBadgeComponent,
    EmptyStateComponent,
    BreadcrumbComponent,
  ],
})
export class MatchDetailPage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  // Lus par le template (bandeau hors-ligne, blocage de "Terminer le match") — pas private,
  // même convention que tournamentId ailleurs dans l'app.
  readonly connectivity = inject(ConnectivityService);
  readonly scoreQueue = inject(ScoreQueueService);

  constructor() {
    addIcons({ alertCircleOutline, cloudOfflineOutline });
  }

  // Pas readonly / pas résolu au constructeur : Angular réutilise l'instance de ce composant
  // en navigant d'un match vers un autre (même route paramétrée /matches/:id), donc
  // route.snapshot ne doit être relu qu'au moment de l'entrée réelle sur l'écran.
  private matchId!: number;

  readonly match = signal<Match | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly starting = signal(false);
  readonly submitting = signal(false);

  // Reflète le score confirmé par le serveur — chaque tap +/- part immédiatement en réseau
  // (voir adjustScore) : mise à jour optimiste locale, réconciliée avec la réponse serveur en
  // cas de succès, annulée en cas d'échec. "Terminer le match" envoie simplement ces totaux
  // déjà confirmés au serveur pour clôturer le match (MatchService.updateScore).
  readonly homeScore = signal(0);
  readonly awayScore = signal(0);

  // Bascule brièvement à chaque +/- pour déclencher l'animation de "pop" sur le score (voir
  // match-detail.page.scss, .score-value.pulse) — purement visuel, pas de lien avec l'état serveur.
  readonly homePulse = signal(false);
  readonly awayPulse = signal(false);

  // Toujours atteint depuis l'écran "Score en direct" du tournoi (voir live-score.page.ts,
  // openMatch()) — /referee/matches n'existe pas comme route, c'était un lien mort avant ce
  // fil d'Ariane.
  readonly breadcrumbSegments = computed<BreadcrumbSegment[]>(() => {
    const m = this.match();
    if (!m) return [{ label: 'Match' }];
    return [
      { label: m.tournamentName, route: ['/tournaments', m.tournamentId, 'live'] },
      { label: `${m.homeTeam.name} vs ${m.awayTeam.name}` },
    ];
  });

  readonly backHref = computed(() => {
    const m = this.match();
    return m ? `/tournaments/${m.tournamentId}/live` : '/tournaments';
  });

  ionViewWillEnter(): void {
    this.matchId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    // Filet de sécurité si l'app a été tuée avec des actions encore en attente — ScoreQueueService
    // retente déjà automatiquement à la reconnexion, mais ça ne fait pas de mal de vérifier aussi
    // à l'entrée sur l'écran (flush() est un no-op si hors-ligne ou déjà en cours).
    void this.scoreQueue.flush();
  }

  statusLabel(status: MatchStatus): string {
    return MATCH_STATUS_LABELS[status];
  }

  statusColor(status: MatchStatus): 'primary' | 'warning' | 'danger' | 'medium' {
    return MATCH_STATUS_COLORS[status];
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.matchService.getById(this.matchId).subscribe({
      next: (match) => {
        this.match.set(match);
        this.homeScore.set(match.homeScore ?? 0);
        this.awayScore.set(match.awayScore ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  incrementHome(): void {
    this.adjustScore('HOME', 1);
  }

  decrementHome(): void {
    if (this.homeScore() === 0) return;
    this.adjustScore('HOME', -1);
  }

  incrementAway(): void {
    this.adjustScore('AWAY', 1);
  }

  decrementAway(): void {
    if (this.awayScore() === 0) return;
    this.adjustScore('AWAY', -1);
  }

  /** Optimiste : le compteur bouge tout de suite, avant même la réponse serveur — sur un
   *  terrain, l'arbitre doit sentir que le tap a marché immédiatement. Réconcilié avec la
   *  réponse serveur en cas de succès (source de vérité), annulé en cas d'échec réel (le
   *  serveur a refusé la requête). En cas d'échec réseau (pas de connexion), le tap part dans
   *  ScoreQueueService au lieu d'être perdu — voir son commentaire pour pourquoi c'est sûr de
   *  rejouer des deltas dans le désordre/en différé. */
  private adjustScore(team: TeamSide, delta: number): void {
    hapticTap();
    const scoreSignal = team === 'HOME' ? this.homeScore : this.awayScore;
    const pulseSignal = team === 'HOME' ? this.homePulse : this.awayPulse;
    scoreSignal.update((v) => Math.max(0, v + delta));
    this.pulse(pulseSignal);

    if (!this.connectivity.online()) {
      void this.scoreQueue.enqueue(this.matchId, team, delta);
      return;
    }

    this.matchService.recordGoal(this.matchId, team, delta).subscribe({
      next: (match) => {
        this.match.set(match);
        this.homeScore.set(match.homeScore ?? 0);
        this.awayScore.set(match.awayScore ?? 0);
      },
      error: (err: HttpErrorResponse) => {
        if (this.isNetworkError(err)) {
          void this.scoreQueue.enqueue(this.matchId, team, delta);
          return;
        }
        scoreSignal.update((v) => Math.max(0, v - delta));
        void this.showErrorToast();
      },
    });
  }

  // status === 0 signale un échec au niveau réseau (pas de connexion, requête jamais arrivée au
  // serveur) plutôt qu'un vrai rejet serveur (403, 404, 500...) — voir HttpErrorResponse.
  private isNetworkError(err: HttpErrorResponse): boolean {
    return err.status === 0;
  }

  start(): void {
    this.starting.set(true);
    this.matchService.start(this.matchId).subscribe({
      next: (match) => {
        this.match.set(match);
        this.starting.set(false);
      },
      error: () => {
        this.starting.set(false);
        void this.showErrorToast();
      },
    });
  }

  async confirmFinish(): Promise<void> {
    if (!this.connectivity.online()) {
      void this.showOfflineToast();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Terminer le match ?',
      message: `Score final : ${this.homeScore()} - ${this.awayScore()}. Cette action est définitive.`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Confirmer', role: 'confirm', handler: () => this.finish() },
      ],
    });
    await alert.present();
  }

  finish(): void {
    this.submitting.set(true);
    this.matchService
      .updateScore(this.matchId, { homeScore: this.homeScore(), awayScore: this.awayScore() })
      .subscribe({
        next: (match) => {
          this.match.set(match);
          this.submitting.set(false);
          hapticSuccess();
        },
        error: () => {
          this.submitting.set(false);
          void this.showErrorToast();
        },
      });
  }

  private pulse(pulseSignal: typeof this.homePulse): void {
    pulseSignal.set(true);
    setTimeout(() => pulseSignal.set(false), 300);
  }

  private async showErrorToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Une erreur est survenue. Réessayez.',
      duration: 3000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }

  private async showOfflineToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Connexion requise pour terminer le match.',
      duration: 3000,
      color: 'warning',
      position: 'top',
    });
    await toast.present();
  }
}
