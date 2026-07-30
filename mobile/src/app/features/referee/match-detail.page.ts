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
import { Match, MatchStatus } from '../../core/models/match.model';

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
  // en navigant d'un match vers un autre (même route paramétrée /referee/matches/:id), donc
  // route.snapshot ne doit être relu qu'au moment de l'entrée réelle sur l'écran.
  private matchId!: number;

  readonly match = signal<Match | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly starting = signal(false);
  readonly submitting = signal(false);

  // Compteurs locaux, saisis pendant que le match est en cours — voir MatchService.updateScore :
  // le backend n'a pas de mise à jour "en cours", seulement une soumission finale qui clôture le
  // match. Rien n'est envoyé au serveur avant la confirmation.
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
    this.homeScore.update((v) => v + 1);
  }

  decrementHome(): void {
    this.homeScore.update((v) => Math.max(0, v - 1));
  }

  incrementAway(): void {
    this.awayScore.update((v) => v + 1);
  }

  decrementAway(): void {
    this.awayScore.update((v) => Math.max(0, v - 1));
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
