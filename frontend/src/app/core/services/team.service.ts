import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Team, TeamRequest } from '../models/team.model';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/teams`;

  getByTournament(tournamentId: number): Observable<Team[]> {
    return this.http
      .get<ApiResponse<Team[]>>(`${this.baseUrl}/tournament/${tournamentId}`)
      .pipe(map((res) => res.data));
  }

  getById(id: number): Observable<Team> {
    return this.http.get<ApiResponse<Team>>(`${this.baseUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: TeamRequest): Observable<Team> {
    return this.http.post<ApiResponse<Team>>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  update(id: number, payload: Partial<TeamRequest>): Observable<Team> {
    return this.http
      .put<ApiResponse<Team>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: number): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  getFollowed(): Observable<Team[]> {
    return this.http.get<ApiResponse<Team[]>>(`${this.baseUrl}/followed`).pipe(map((res) => res.data));
  }

  isFollowing(id: number): Observable<{ following: boolean }> {
    return this.http
      .get<ApiResponse<{ following: boolean }>>(`${this.baseUrl}/${id}/follow`)
      .pipe(map((res) => res.data));
  }

  follow(id: number): Observable<{ following: boolean }> {
    return this.http
      .post<ApiResponse<{ following: boolean }>>(`${this.baseUrl}/${id}/follow`, {})
      .pipe(map((res) => res.data));
  }

  unfollow(id: number): Observable<{ following: boolean }> {
    return this.http
      .delete<ApiResponse<{ following: boolean }>>(`${this.baseUrl}/${id}/follow`)
      .pipe(map((res) => res.data));
  }
}
