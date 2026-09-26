import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonChip,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, calendarOutline } from 'ionicons/icons';
import { MatchService } from '../../core/services/match.service';
import { LiveUpdateService } from '../../core/services/live-update.service';
import { Match } from '../../core/models/match.model';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { MatchRowComponent } from '../../shared/ui/match-row/match-row';
import { MatchRowSkeletonComponent } from '../../shared/ui/match-row-skeleton/match-row-skeleton';
import { BreadcrumbComponent, BreadcrumbSegment } from '../../shared/ui/breadcrumb/breadcrumb';

const UNASSIGNED_VENUE = 'Terrain à définir';
const ALL_VENUES = 'Tous';

/** Vue "agenda" du planning d'un tournoi — sur mobile une vraie grille (colonnes = terrains)
 *  demanderait un scroll horizontal peu pratique, donc liste triée chronologiquement filtrable
 *  par terrain (chips), plutôt qu'un tableau. Calquée sur live-score.page.ts pour le chargement
 *  et le rafraîchissement live. */
@Component({
  selector: 'app-planning',
  templateUrl: './planning.page.html',
  styleUrls: ['./planning.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonChip,
    IonLabel,
    EmptyStateComponent,
    MatchRowComponent,
    MatchRowSkeletonComponent,
    BreadcrumbComponent,
  ],
})
export class PlanningPage implements ViewWillEnter, ViewWillLeave {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchService = inject(MatchService);
  private readonly liveUpdateService = inject(LiveUpdateService);

  // Pas private : lu par le template (defaultHref du back-button, fil d'Ariane) — même
  // convention que live-score.page.ts.
  tournamentId!: number;
  private unsubscribeLive: (() => void) | null = null;

  readonly matches = signal<Match[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly selectedVenue = signal<string>(ALL_VENUES);

  readonly skeletonRows = [0, 1, 2, 3];
  readonly allVenuesLabel = ALL_VENUES;

  readonly breadcrumbSegments = computed<BreadcrumbSegment[]>(() => [
    { label: this.matches()[0]?.tournamentName ?? 'Tournoi', route: ['/tournaments', this.tournamentId] },
    { label: 'Planning' },
  ]);

  readonly venues = computed<string[]>(() => {
    const names = new Set(this.matches().map((m) => m.venue ?? UNASSIGNED_VENUE));
    return [ALL_VENUES, ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  });

  readonly filteredMatches = computed<Match[]>(() => {
    const venue = this.selectedVenue();
    const list = venue === ALL_VENUES ? this.matches() : this.matches().filter((m) => (m.venue ?? UNASSIGNED_VENUE) === venue);
    // Les matchs sans horaire (date null) passent en fin de liste plutôt que de casser le tri.
    return [...list].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  });

  constructor() {
    addIcons({ alertCircleOutline, calendarOutline });
  }

  // Ionic met en cache l'instance de la page pour l'animation de retour plutôt que de la
  // détruire/recréer — on s'abonne/désabonne au WebSocket en symétrie avec l'entrée/sortie
  // réelle de l'écran, et on réinitialise le filtre pour ne pas garder un terrain d'un tournoi
  // précédent si la page est réutilisée.
  ionViewWillEnter(): void {
    this.tournamentId = Number(this.route.snapshot.paramMap.get('id'));
    this.selectedVenue.set(ALL_VENUES);
    this.load();
    this.unsubscribeLive = this.liveUpdateService.subscribeToTournament(this.tournamentId, () => this.load());
  }

  ionViewWillLeave(): void {
    this.unsubscribeLive?.();
    this.unsubscribeLive = null;
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

  selectVenue(venue: string): void {
    this.selectedVenue.set(venue);
  }

  matchMeta(match: Match): string {
    const parts: string[] = [match.venue ?? UNASSIGNED_VENUE];
    if (match.date) {
      const d = new Date(match.date);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      parts.push(`${hh}:${mm}`);
    }
    if (match.phase) parts.push(match.phase);
    return parts.join(' · ');
  }

  openMatch(matchId: number): void {
    this.router.navigate(['/matches', matchId]);
  }
}
