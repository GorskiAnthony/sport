import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { OrganizerDashboardStats } from '../models/dashboard-stats.model';

@Injectable({ providedIn: 'root' })
export class DashboardStatsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  getOrganizerStats(): Observable<OrganizerDashboardStats> {
    return this.http
      .get<ApiResponse<OrganizerDashboardStats>>(`${this.baseUrl}/organizer`)
      .pipe(map((res) => res.data));
  }
}
