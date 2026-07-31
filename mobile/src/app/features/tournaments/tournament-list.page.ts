import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trophyOutline, alertCircleOutline } from 'ionicons/icons';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentSummary } from '../../core/models/tournament.model';
import { TournamentCardComponent } from '../../shared/ui/tournament-card/tournament-card';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-tournament-list',
  templateUrl: './tournament-list.page.html',
  styleUrls: ['./tournament-list.page.scss'],
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    TournamentCardComponent,
    EmptyStateComponent,
  ],
})
export class TournamentListPage implements ViewWillEnter {
  private readonly tournamentService = inject(TournamentService);
  private readonly router = inject(Router);

  readonly tournaments = signal<TournamentSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    addIcons({ addOutline, trophyOutline, alertCircleOutline });
  }

  // Ionic met en cache l'instance de la page pour l'animation de retour plutôt que de la
  // détruire/recréer : ngOnInit ne se redéclenche pas en revenant sur cet écran (ex. depuis le
  // score en direct), d'où le hook de cycle de vie Ionic ici.
  ionViewWillEnter(): void {
    this.load();
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

  openTournament(tournamentId: number): void {
    this.router.navigate(['/tournaments', tournamentId]);
  }

  openRefereeCode(tournamentId: number): void {
    this.router.navigate(['/tournaments', tournamentId, 'referee-code']);
  }
}
