import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { TournamentSessionStorageService } from './tournament-session-storage.service';

export interface TournamentSession {
  sessionToken: string;
  tournamentId: number;
  tournamentName: string;
  refereeName: string | null;
}

export interface TournamentJoinResponse {
  sessionToken: string;
  tournamentId: number;
  tournamentName: string;
}

/** Session éphémère et sans compte, obtenue en scannant le QR code d'un tournoi (voir
 *  features/join/join.page.ts) — coexiste avec AuthService plutôt que de le remplacer.
 *  authInterceptor retombe sur ce token quand aucun utilisateur normal n'est connecté, et
 *  authGuard accepte l'un ou l'autre. */
@Injectable({ providedIn: 'root' })
export class TournamentSessionService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TournamentSessionStorageService);

  private readonly sessionSignal = signal<TournamentSession | null>(null);

  readonly isActive = computed(() => this.sessionSignal() !== null);
  readonly tournamentId = computed(() => this.sessionSignal()?.tournamentId ?? null);
  readonly tournamentName = computed(() => this.sessionSignal()?.tournamentName ?? null);
  readonly refereeName = computed(() => this.sessionSignal()?.refereeName ?? null);

  private restoreSessionPromise: Promise<void> | null = null;

  /** À appeler au démarrage, comme AuthService.restoreSession() — voir main.ts et le
   *  commentaire détaillé dans AuthService sur pourquoi c'est mémoïsé et rappelé depuis
   *  authGuard plutôt que de compter sur l'ordre du bootstrap. Sans ça, un arbitre qui a mis
   *  l'app en arrière-plan (courant sur une session de 30 jours) serait renvoyé sur /login et
   *  devrait rescanner le QR code physique. */
  restoreSession(): Promise<void> {
    if (!this.restoreSessionPromise) {
      this.restoreSessionPromise = this.doRestoreSession();
    }
    return this.restoreSessionPromise;
  }

  private async doRestoreSession(): Promise<void> {
    const json = await this.storage.get();
    if (!json) return;
    try {
      this.sessionSignal.set(JSON.parse(json) as TournamentSession);
    } catch {
      await this.storage.clear();
    }
  }

  join(token: string, refereeName?: string): Observable<TournamentJoinResponse> {
    return this.http
      .post<ApiResponse<TournamentJoinResponse>>(`${environment.apiUrl}/tournaments/join`, { token, refereeName })
      .pipe(
        map((res) => res.data),
        tap((response) => this.persistSession(response, refereeName ?? null)),
      );
  }

  getToken(): string | null {
    return this.sessionSignal()?.sessionToken ?? null;
  }

  clear(): void {
    void this.storage.clear();
    this.sessionSignal.set(null);
  }

  private persistSession(response: TournamentJoinResponse, refereeName: string | null): void {
    const session: TournamentSession = {
      sessionToken: response.sessionToken,
      tournamentId: response.tournamentId,
      tournamentName: response.tournamentName,
      refereeName,
    };
    void this.storage.set(JSON.stringify(session));
    this.sessionSignal.set(session);
  }
}
