import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TeamSide } from '../models/match.model';
import { MatchService } from './match.service';
import { ConnectivityService } from './connectivity.service';
import { PendingScoreAction, ScoreQueueStorageService } from './score-queue-storage.service';

/** File d'attente des ajustements de score tapés hors-ligne (voir match-detail.page.ts,
 *  adjustScore()) — recordGoal est un incrément atomique côté serveur (voir
 *  MatchRepository.incrementHomeScore/AwayScore), donc les deltas en attente sont commutatifs :
 *  pas besoin de résolution de conflit, juste les rejouer dans l'ordre dès que la connexion
 *  revient. "Terminer le match" reste volontairement hors de cette file (overwrite complet, pas
 *  un delta — voir le plan de la feature hors-ligne). */
@Injectable({ providedIn: 'root' })
export class ScoreQueueService {
  private readonly storage = inject(ScoreQueueStorageService);
  private readonly matchService = inject(MatchService);
  private readonly connectivity = inject(ConnectivityService);

  private readonly actions = signal<PendingScoreAction[]>([]);
  private flushing = false;
  // Chargement initial async (Preferences) — enqueue()/flush() attendent dessus avant de lire
  // this.actions() : sans ça, un enqueue() appelé juste après la construction du service peut
  // s'exécuter avant que ce chargement ne résolve, qui l'écraserait ensuite avec l'ancien
  // contenu (vide) une fois résolu.
  private readonly ready: Promise<void>;

  readonly pendingCount = computed(() => this.actions().length);

  constructor() {
    this.ready = this.loadFromStorage();

    // Retente automatiquement dès que la connexion revient (et à l'init si des actions étaient
    // déjà en attente d'une session précédente, ex. app tuée avant reconnexion).
    effect(() => {
      if (this.connectivity.online()) {
        void this.flush();
      }
    });
  }

  async enqueue(matchId: number, team: TeamSide, delta: number): Promise<void> {
    await this.ready;
    const next = [...this.actions(), { id: crypto.randomUUID(), matchId, team, delta }];
    this.actions.set(next);
    await this.storage.setAll(next);
  }

  async flush(): Promise<void> {
    await this.ready;
    if (this.flushing || !this.connectivity.online()) return;
    this.flushing = true;

    try {
      // Une action à la fois, dans l'ordre — si l'une échoue (ex. connexion coupée en cours de
      // route), on s'arrête et on garde le reste en file plutôt que de désynchroniser l'ordre.
      while (this.actions().length > 0) {
        const [next, ...rest] = this.actions();
        try {
          await firstValueFrom(this.matchService.recordGoal(next.matchId, next.team, next.delta));
          this.actions.set(rest);
          await this.storage.setAll(rest);
        } catch {
          break;
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  private async loadFromStorage(): Promise<void> {
    this.actions.set(await this.storage.getAll());
  }
}
