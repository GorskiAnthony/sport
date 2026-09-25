import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { RecentTournament, RefereeJoinInfo, TournamentDetail, TournamentRequest, TournamentSummary } from '../models/tournament.model';

const SEARCH_CACHE_TTL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tournaments`;

  // Retyping/going back to a search term the user just tried (e.g. via browser back) shouldn't
  // re-hit the backend — small in-memory cache, cleared on its own after SEARCH_CACHE_TTL_MS.
  private readonly searchCache = new Map<string, { data: TournamentSummary[]; expiresAt: number }>();

  /** search narrows the results server-side (GET /api/tournaments?search=...) — see
   *  tournaments.ts for the debounced search box. */
  getAll(search?: string): Observable<TournamentSummary[]> {
    const key = search?.trim() ?? '';
    const cached = this.searchCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return of(cached.data);
    }

    const params = key ? new HttpParams().set('search', key) : undefined;
    return this.http.get<ApiResponse<TournamentSummary[]>>(this.baseUrl, { params }).pipe(
      map((res) => res.data),
      tap((data) => this.searchCache.set(key, { data, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS })),
    );
  }

  getMine(): Observable<TournamentSummary[]> {
    return this.http
      .get<ApiResponse<TournamentSummary[]>>(`${this.baseUrl}/me`)
      .pipe(map((res) => res.data));
  }

  getById(id: number): Observable<TournamentDetail> {
    return this.http
      .get<ApiResponse<TournamentDetail>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: TournamentRequest): Observable<TournamentSummary> {
    return this.http
      .post<ApiResponse<TournamentSummary>>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  update(id: number, payload: Partial<TournamentRequest>): Observable<TournamentSummary> {
    return this.http
      .put<ApiResponse<TournamentSummary>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: number): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  recordView(id: number): Observable<void> {
    return this.http
      .post<ApiResponse<{ recorded: boolean }>>(`${this.baseUrl}/${id}/view`, {})
      .pipe(map(() => undefined));
  }

  recordSponsorClick(id: number): Observable<void> {
    return this.http
      .post<ApiResponse<{ recorded: boolean }>>(`${this.baseUrl}/${id}/sponsor-click`, {})
      .pipe(map(() => undefined));
  }

  getRecentlyViewed(): Observable<RecentTournament[]> {
    return this.http
      .get<ApiResponse<RecentTournament[]>>(`${this.baseUrl}/recent`)
      .pipe(map((res) => res.data));
  }

  getRefereeJoinInfo(id: number): Observable<RefereeJoinInfo> {
    return this.http
      .get<ApiResponse<RefereeJoinInfo>>(`${this.baseUrl}/${id}/referee-token`)
      .pipe(map((res) => res.data));
  }

  regenerateRefereeJoinToken(id: number): Observable<RefereeJoinInfo> {
    return this.http
      .post<ApiResponse<RefereeJoinInfo>>(`${this.baseUrl}/${id}/referee-token/regenerate`, {})
      .pipe(map((res) => res.data));
  }
}
