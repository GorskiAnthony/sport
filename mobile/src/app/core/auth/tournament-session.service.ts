import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
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
 *  authGuard accepte l'un ou l'autre.
 *
 *  Même bifurcation natif/web que AuthService : le natif persiste sessionToken +
 *  tournamentId/tournamentName/refereeName dans TournamentSessionStorageService (chiffré) pour
 *  survivre à une mise en arrière-plan de plusieurs semaines sans réseau ; le build web n'écrit
 *  plus rien (le token vit dans le même cookie httpOnly que AuthController, posé côté backend
 *  par TournamentController.joinAsReferee) et ne garde la session qu'en mémoire pour l'onglet en
 *  cours — un rafraîchissement de page y met fin, l'arbitre doit rescanner le QR code. C'est un
 *  compromis assumé : il n'existe pas d'endpoint pour relire l'identité d'une session arbitre à
 *  partir du seul cookie (contrairement à /auth/me pour un vrai compte). */
@Injectable({ providedIn: 'root' })
export class TournamentSessionService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TournamentSessionStorageService);
  private readonly isNative = Capacitor.isNativePlatform();

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
   *  devrait rescanner le QR code physique — natif uniquement, voir la doc de classe. */
  restoreSession(): Promise<void> {
    if (!this.restoreSessionPromise) {
      this.restoreSessionPromise = this.isNative ? this.doRestoreNativeSession() : Promise.resolve();
    }
    return this.restoreSessionPromise;
  }

  private async doRestoreNativeSession(): Promise<void> {
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

  /** null sur le build web : le token n'est plus lisible côté client, voir la doc de classe. */
  getToken(): string | null {
    return this.isNative ? (this.sessionSignal()?.sessionToken ?? null) : null;
  }

  clear(): void {
    if (this.isNative) {
      void this.storage.clear();
    }
    this.sessionSignal.set(null);
  }

  private persistSession(response: TournamentJoinResponse, refereeName: string | null): void {
    const session: TournamentSession = {
      sessionToken: response.sessionToken,
      tournamentId: response.tournamentId,
      tournamentName: response.tournamentName,
      refereeName,
    };
    if (this.isNative) {
      void this.storage.set(JSON.stringify(session));
    }
    this.sessionSignal.set(session);
  }
}
