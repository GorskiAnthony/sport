import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Observable, catchError, firstValueFrom, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, Role, User } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface LoginPayload {
  email: string;
  password: string;
}

/** Équivalent mobile de frontend/src/app/core/auth/auth.service.ts, avec une bifurcation par
 *  plateforme (Capacitor.isNativePlatform()) :
 *  - natif : inchangé — JWT dans TokenStorageService (Capacitor Secure Storage, chiffré via
 *    Keystore/Keychain), mis en cache dans tokenSignal pour que l'intercepteur HTTP (synchrone)
 *    puisse construire le header Authorization sans attendre.
 *  - build web (déployé sur le domaine mobile-web, voir mobile/nginx.conf) : même stratégie que
 *    le frontend — le JWT vit dans un cookie httpOnly posé par le backend (AuthCookieService),
 *    jamais lu ni persisté ici ; SecureStoragePlugin dégraderait de toute façon vers
 *    localStorage dans un navigateur (voir web.js du plugin), donc aucune raison de s'en servir
 *    côté web. L'utilisateur courant est réhydraté via GET /auth/me à chaque démarrage. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly isNative = Capacitor.isNativePlatform();

  private readonly tokenSignal = signal<string | null>(null);
  private readonly currentUserSignal = signal<User | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  private restoreSessionPromise: Promise<void> | null = null;

  /** À appeler avant que l'app ne rende quoi que ce soit authentifié — voir main.ts
   *  (provideAppInitializer) ET auth.guard.ts, qui l'attendent tous les deux. Mémoïsée : malgré
   *  withEnabledBlockingInitialNavigation, le guard de la toute première navigation peut
   *  s'exécuter avant que cette promesse (lecture async du stockage sécurisé, ou appel réseau
   *  côté web) ne soit résolue — la garantie d'ordonnancement du bootstrap Angular ne suffit pas
   *  ici. Le guard rappelle donc restoreSession() lui-même et attend la même promesse en vol
   *  plutôt que de lire les signaux en supposant qu'ils sont déjà à jour. */
  restoreSession(): Promise<void> {
    if (!this.restoreSessionPromise) {
      this.restoreSessionPromise = this.isNative ? this.doRestoreNativeSession() : this.doRestoreWebSession();
    }
    return this.restoreSessionPromise;
  }

  private async doRestoreNativeSession(): Promise<void> {
    const [token, userJson] = await Promise.all([this.tokenStorage.getToken(), this.tokenStorage.getUser()]);

    this.tokenSignal.set(token);

    if (!userJson) return;
    try {
      this.currentUserSignal.set(JSON.parse(userJson) as User);
    } catch {
      await this.tokenStorage.removeUser();
    }
  }

  private async doRestoreWebSession(): Promise<void> {
    const user = await firstValueFrom(
      this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(catchError(() => of(null))),
    );
    this.currentUserSignal.set(user);
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  logout(): void {
    // Révocation côté serveur d'abord — fire-and-forget : subscribe() est synchrone donc
    // l'intercepteur/le cookie sont encore valides pour cet appel-là. Le logout client doit
    // réussir même si l'appel réseau échoue (token déjà expiré, hors ligne...).
    if (this.isNative ? this.tokenSignal() !== null : this.isAuthenticated()) {
      this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });
    }

    if (this.isNative) {
      void this.tokenStorage.clear();
      this.tokenSignal.set(null);
    }
    this.currentUserSignal.set(null);
  }

  /** null sur le build web : le token n'est plus lisible côté client, voir la doc de classe. */
  getToken(): string | null {
    return this.isNative ? this.tokenSignal() : null;
  }

  refreshUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        if (this.isNative) {
          void this.tokenStorage.setSession(this.tokenSignal() ?? '', JSON.stringify(user));
        }
        this.currentUserSignal.set(user);
      }),
    );
  }

  updateProfile(payload: { name: string; avatarUrl: string | null; bannerUrl: string | null }): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/auth/me`, payload).pipe(
      tap((user) => {
        if (this.isNative) {
          void this.tokenStorage.setSession(this.tokenSignal() ?? '', JSON.stringify(user));
        }
        this.currentUserSignal.set(user);
      }),
    );
  }

  private persistSession(response: AuthResponse): void {
    if (this.isNative) {
      void this.tokenStorage.setSession(response.token, JSON.stringify(response.user));
      this.tokenSignal.set(response.token);
    }
    this.currentUserSignal.set(response.user);
  }
}
