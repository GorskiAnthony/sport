import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Match, MatchRequest, MatchScoreRequest } from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/matches`;

  getByTournament(tournamentId: number): Observable<Match[]> {
    return this.http
      .get<ApiResponse<Match[]>>(`${this.baseUrl}/tournament/${tournamentId}`)
      .pipe(map((res) => res.data));
  }

  getById(id: number): Observable<Match> {
    return this.http.get<ApiResponse<Match>>(`${this.baseUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: MatchRequest): Observable<Match> {
    return this.http.post<ApiResponse<Match>>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  updateScore(id: number, payload: MatchScoreRequest): Observable<Match> {
    return this.http
      .patch<ApiResponse<Match>>(`${this.baseUrl}/${id}/score`, payload)
      .pipe(map((res) => res.data));
  }

  start(id: number): Observable<Match> {
    return this.http.patch<ApiResponse<Match>>(`${this.baseUrl}/${id}/start`, {}).pipe(map((res) => res.data));
  }

  recordForfeit(id: number, teamId: number): Observable<Match> {
    return this.http
      .patch<ApiResponse<Match>>(`${this.baseUrl}/${id}/forfeit`, { teamId })
      .pipe(map((res) => res.data));
  }

  delete(id: number): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }
}
