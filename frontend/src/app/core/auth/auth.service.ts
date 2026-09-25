import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, catchError, firstValueFrom, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, Role, User } from '../models/user.model';

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

/** The JWT lives in an httpOnly cookie the backend sets on register/login (see AuthCookieService
 *  server-side) — nothing here ever reads or persists it; the browser attaches it automatically
 *  on every /api/* request (see the credentials interceptor). The `user` object isn't persisted
 *  either (previously localStorage, readable by any injected script for as long as the session
 *  lasted) — it only ever lives in this in-memory signal, rebuilt from GET /auth/me on each app
 *  start. SSR keeps rendering logged-out, as before (no cookie forwarding to the SSR process);
 *  the client rehydrates after bootstrap via restoreSession(). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly http = inject(HttpClient);

  private readonly currentUserSignal = signal<User | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  private restoreSessionPromise: Promise<void> | null = null;

  /** Call once at app start (see app.config.ts) before anything that depends on
   *  isAuthenticated()/currentUser() renders — memoized and safe to call again from auth.guard.ts
   *  if a navigation guard runs before the initializer's promise has resolved. */
  restoreSession(): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }
    if (!this.restoreSessionPromise) {
      this.restoreSessionPromise = this.doRestoreSession();
    }
    return this.restoreSessionPromise;
  }

  private async doRestoreSession(): Promise<void> {
    const user = await firstValueFrom(
      this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(catchError(() => of(null))),
    );
    this.currentUserSignal.set(user);
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap((response) => this.currentUserSignal.set(response.user)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap((response) => this.currentUserSignal.set(response.user)));
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  logout(): void {
    // Revoke server-side and clear the cookie — fire-and-forget: logout must still succeed
    // client-side even if this call fails (network down, cookie already expired).
    if (this.isAuthenticated()) {
      this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });
    }
    this.currentUserSignal.set(null);
  }

  updatePlan(plan: User['plan']): void {
    const current = this.currentUserSignal();
    if (!current) return;
    this.currentUserSignal.set({ ...current, plan });
  }

  /** Le plan stocké côté client date du dernier login/register (ou du dernier appel à
   *  updatePlan) : après un paiement Stripe (checkout hébergé, mis à jour par webhook côté
   *  serveur), rien ne le rafraîchit spontanément. À appeler au retour d'un checkout réussi. */
  refreshUser(): Observable<User> {
    return this.http
      .get<User>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  updateProfile(payload: { name: string; avatarUrl: string | null; bannerUrl: string | null }): Observable<User> {
    return this.http
      .patch<User>(`${environment.apiUrl}/auth/me`, payload)
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }
}
