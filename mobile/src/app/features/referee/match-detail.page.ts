import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonBadge,
  IonSpinner,
  IonText,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { MatchService } from '../../core/services/match.service';
import { Match, MatchStatus, TeamSide } from '../../core/models/match.model';

const STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'À venir',
  ONGOING: 'En cours',
  FINISHED: 'Terminé',
  FORFEIT: 'Forfait',
};

const STATUS_COLORS: Record<MatchStatus, string> = {
  SCHEDULED: 'warning',
  ONGOING: 'primary',
  FINISHED: 'medium',
  FORFEIT: 'danger',
};

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
    IonContent,
    IonBadge,
    IonSpinner,
    IonText,
  ],
})
export class MatchDetailPage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

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

  ionViewWillEnter(): void {
    this.matchId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  statusLabel(status: MatchStatus): string {
    return STATUS_LABELS[status];
  }

  statusColor(status: MatchStatus): string {
    return STATUS_COLORS[status];
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
   *  réponse serveur en cas de succès (source de vérité), annulé en cas d'échec. */
  private adjustScore(team: TeamSide, delta: number): void {
    const scoreSignal = team === 'HOME' ? this.homeScore : this.awayScore;
    scoreSignal.update((v) => Math.max(0, v + delta));

    this.matchService.recordGoal(this.matchId, team, delta).subscribe({
      next: (match) => {
        this.match.set(match);
        this.homeScore.set(match.homeScore ?? 0);
        this.awayScore.set(match.awayScore ?? 0);
      },
      error: () => {
        scoreSignal.update((v) => Math.max(0, v - delta));
        void this.showErrorToast();
      },
    });
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
        },
        error: () => {
          this.submitting.set(false);
          void this.showErrorToast();
        },
      });
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
}
