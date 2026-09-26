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
    EmptyStateComponent,
    MatchRowComponent,
    MatchRowSkeletonComponent,
    BreadcrumbComponent,
  ],
})
export class LiveScorePage implements ViewWillEnter, ViewWillLeave {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchService = inject(MatchService);
  private readonly liveUpdateService = inject(LiveUpdateService);

  // Pas readonly / pas résolu au constructeur : Angular réutilise l'instance de ce composant en
  // navigant d'un tournoi vers un autre (même route paramétrée /tournaments/:id/live), donc
  // route.snapshot ne doit être relu qu'au moment de l'entrée réelle sur l'écran. Pas private :
  // lu par le template (defaultHref du back-button, fil d'Ariane).
  tournamentId!: number;
  private unsubscribeLive: (() => void) | null = null;

  readonly matches = signal<Match[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly skeletonRows = [0, 1, 2, 3];

  readonly breadcrumbSegments = computed<BreadcrumbSegment[]>(() => [
    { label: this.matches()[0]?.tournamentName ?? 'Tournoi', route: ['/tournaments', this.tournamentId] },
    { label: 'Score en direct' },
  ]);

  constructor() {
    addIcons({ alertCircleOutline, calendarOutline });
  }

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

  // L'organisateur a les mêmes droits que l'arbitre assigné sur un match de son propre tournoi
  // (MatchService.requireCanManage côté backend) — ce n'était pas exploité ici, l'écran était
  // resté purement lecture seule.
  openMatch(matchId: number): void {
    this.router.navigate(['/matches', matchId]);
  }
}
