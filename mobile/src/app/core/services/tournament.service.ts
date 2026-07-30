import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { TournamentSummary } from '../models/tournament.model';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tournaments`;

  getMine(): Observable<TournamentSummary[]> {
    return this.http.get<ApiResponse<TournamentSummary[]>>(`${this.baseUrl}/me`).pipe(map((res) => res.data));
  }
}
