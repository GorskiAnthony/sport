import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonListHeader,
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
import { MatchService } from '../../core/services/match.service';
import { Match, MatchStatus } from '../../core/models/match.model';

const STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'À venir',
  ONGOING: 'En cours',
  FINISHED: 'Terminé',
  FORFEIT: 'Forfait',
};

// Même mapping que status-badge.ts côté web — voir .claude/skills/design-system.
const STATUS_COLORS: Record<MatchStatus, string> = {
  SCHEDULED: 'warning',
  ONGOING: 'primary',
  FINISHED: 'medium',
  FORFEIT: 'danger',
};

@Component({
  selector: 'app-referee-matches',
  templateUrl: './referee-matches.page.html',
  styleUrls: ['./referee-matches.page.scss'],
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonText,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class RefereeMatchesPage implements ViewWillEnter {
  private readonly authService = inject(AuthService);
  private readonly matchService = inject(MatchService);
  private readonly router = inject(Router);

  private readonly matches = signal<Match[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  // Ce qui demande une action de l'arbitre en premier, ce qui est réglé en dessous — un arbitre
  // ne devrait jamais avoir à faire défiler des matchs terminés pour trouver le prochain à jouer.
  readonly toHandle = computed(() =>
    this.matches()
      .filter((m) => m.status === 'SCHEDULED' || m.status === 'ONGOING')
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
  );

  readonly done = computed(() =>
    this.matches()
      .filter((m) => m.status === 'FINISHED' || m.status === 'FORFEIT')
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
  );

  constructor() {
    addIcons({ logOutOutline });
  }

  // Ionic met en cache l'instance de la page pour l'animation de retour plutôt que de la
  // détruire/recréer : ngOnInit ne se redéclenche pas quand on revient sur cet écran depuis le
  // détail d'un match (score fraîchement saisi), d'où le hook de cycle de vie Ionic ici.
  ionViewWillEnter(): void {
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
    this.matchService.getMine().subscribe({
      next: (matches) => {
        this.matches.set(matches);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  refresh(event: RefresherCustomEvent): void {
    this.matchService.getMine().subscribe({
      next: (matches) => {
        this.matches.set(matches);
        this.error.set(false);
        event.target.complete();
      },
      error: () => {
        this.error.set(true);
        event.target.complete();
      },
    });
  }

  openMatch(matchId: number): void {
    this.router.navigate(['/referee/matches', matchId]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
