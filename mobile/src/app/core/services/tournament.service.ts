import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { RefereeJoinInfo, TournamentDetail, TournamentRequest, TournamentSummary } from '../models/tournament.model';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tournaments`;

  getMine(): Observable<TournamentSummary[]> {
    return this.http.get<ApiResponse<TournamentSummary[]>>(`${this.baseUrl}/me`).pipe(map((res) => res.data));
  }

  getById(id: number): Observable<TournamentDetail> {
    return this.http.get<ApiResponse<TournamentDetail>>(`${this.baseUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: TournamentRequest): Observable<TournamentSummary> {
    return this.http.post<ApiResponse<TournamentSummary>>(this.baseUrl, payload).pipe(map((res) => res.data));
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

  getRefereeJoinInfo(tournamentId: number): Observable<RefereeJoinInfo> {
    return this.http
      .get<ApiResponse<RefereeJoinInfo>>(`${this.baseUrl}/${tournamentId}/referee-token`)
      .pipe(map((res) => res.data));
  }

  regenerateRefereeJoinToken(tournamentId: number): Observable<RefereeJoinInfo> {
    return this.http
      .post<ApiResponse<RefereeJoinInfo>>(`${this.baseUrl}/${tournamentId}/referee-token/regenerate`, {})
      .pipe(map((res) => res.data));
  }
}
