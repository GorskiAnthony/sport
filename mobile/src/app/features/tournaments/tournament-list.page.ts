import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentStatus, TournamentSummary } from '../../core/models/tournament.model';

const STATUS_LABELS: Record<TournamentStatus, string> = {
  UPCOMING: 'À venir',
  ONGOING: 'En cours',
  FINISHED: 'Terminé',
};

// Couleurs Ionic thémées avec la palette du design-system : primary = vert (ongoing/live),
// warning = ambre (à venir), medium = gris/slate (terminé). Voir .claude/skills/design-system.
const STATUS_COLORS: Record<TournamentStatus, string> = {
  UPCOMING: 'warning',
  ONGOING: 'primary',
  FINISHED: 'medium',
};

@Component({
  selector: 'app-tournament-list',
  templateUrl: './tournament-list.page.html',
  styleUrls: ['./tournament-list.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonText,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class TournamentListPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tournamentService = inject(TournamentService);
  private readonly router = inject(Router);

  readonly tournaments = signal<TournamentSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    addIcons({ logOutOutline });
  }

  ngOnInit(): void {
    this.load();
  }

  statusLabel(status: TournamentStatus): string {
    return STATUS_LABELS[status];
  }

  statusColor(status: TournamentStatus): string {
    return STATUS_COLORS[status];
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.tournamentService.getMine().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  refresh(event: RefresherCustomEvent): void {
    this.tournamentService.getMine().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        this.error.set(false);
        event.target.complete();
      },
      error: () => {
        this.error.set(true);
        event.target.complete();
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openLive(tournamentId: number): void {
    this.router.navigate(['/tournaments', tournamentId, 'live']);
  }
}
