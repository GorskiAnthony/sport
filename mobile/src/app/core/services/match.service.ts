import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Match, MatchScoreRequest } from '../models/match.model';

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

  /** Matchs assignés à l'arbitre connecté (voir MatchController.findAssignedToMe côté backend). */
  getMine(): Observable<Match[]> {
    return this.http.get<ApiResponse<Match[]>>(`${this.baseUrl}/mine`).pipe(map((res) => res.data));
  }

  start(id: number): Observable<Match> {
    return this.http.patch<ApiResponse<Match>>(`${this.baseUrl}/${id}/start`, {}).pipe(map((res) => res.data));
  }

  /** Termine le match : le backend fixe toujours le statut à FINISHED en retour, il n'y a pas
   *  de mise à jour "en cours" séparée — voir MatchService.updateScore côté backend. */
  updateScore(id: number, payload: MatchScoreRequest): Observable<Match> {
    return this.http
      .patch<ApiResponse<Match>>(`${this.baseUrl}/${id}/score`, payload)
      .pipe(map((res) => res.data));
  }
}
