import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
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

/** Équivalent mobile de frontend/src/app/core/auth/auth.service.ts : même API backend, mais
 *  TokenStorageService (Capacitor Preferences, async) au lieu de localStorage. Le token est mis
 *  en cache dans un signal pour que l'intercepteur HTTP (synchrone) puisse le lire sans
 *  attendre — restoreSession() doit avoir tourné avant le premier appel authentifié, ce que
 *  garantit le provideAppInitializer branché dans main.ts. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly tokenSignal = signal<string | null>(null);
  private readonly currentUserSignal = signal<User | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  /** À appeler une seule fois, avant que l'app ne rende quoi que ce soit authentifié. */
  async restoreSession(): Promise<void> {
    const [token, userJson] = await Promise.all([this.tokenStorage.getToken(), this.tokenStorage.getUser()]);

    this.tokenSignal.set(token);

    if (!userJson) return;
    try {
      this.currentUserSignal.set(JSON.parse(userJson) as User);
    } catch {
      await this.tokenStorage.removeUser();
    }
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
    // l'intercepteur lit encore le token (pas encore effacé) pour cet appel-là. Le logout
    // client doit réussir même si l'appel réseau échoue (token déjà expiré, hors ligne...).
    if (this.tokenSignal()) {
      this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });
    }

    void this.tokenStorage.clear();
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  refreshUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        void this.tokenStorage.setSession(this.tokenSignal() ?? '', JSON.stringify(user));
        this.currentUserSignal.set(user);
      }),
    );
  }

  private persistSession(response: AuthResponse): void {
    void this.tokenStorage.setSession(response.token, JSON.stringify(response.user));
    this.tokenSignal.set(response.token);
    this.currentUserSignal.set(response.user);
  }
}
