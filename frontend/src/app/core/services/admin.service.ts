import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AdminLocationStats,
  AdminOverview,
  AdminTournamentSummary,
  AdminUserDetail,
  AdminUserSummary,
} from '../models/admin.model';
import { ApiResponse } from '../models/api-response.model';
import { TournamentStatus } from '../models/tournament.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  getOverview(): Observable<AdminOverview> {
    return this.http.get<ApiResponse<AdminOverview>>(`${this.baseUrl}/overview`).pipe(map((res) => res.data));
  }

  searchUsers(search?: string): Observable<AdminUserSummary[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http
      .get<ApiResponse<AdminUserSummary[]>>(`${this.baseUrl}/users`, { params })
      .pipe(map((res) => res.data));
  }

  getUser(id: number): Observable<AdminUserDetail> {
    return this.http.get<ApiResponse<AdminUserDetail>>(`${this.baseUrl}/users/${id}`).pipe(map((res) => res.data));
  }

  searchTournaments(search?: string, status?: TournamentStatus): Observable<AdminTournamentSummary[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);

    return this.http
      .get<ApiResponse<AdminTournamentSummary[]>>(`${this.baseUrl}/tournaments`, { params })
      .pipe(map((res) => res.data));
  }

  getLocationStats(): Observable<AdminLocationStats[]> {
    return this.http
      .get<ApiResponse<AdminLocationStats[]>>(`${this.baseUrl}/locations`)
      .pipe(map((res) => res.data));
  }
}
