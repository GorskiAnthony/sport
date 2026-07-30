import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Match } from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/matches`;

  getByTournament(tournamentId: number): Observable<Match[]> {
    return this.http
      .get<ApiResponse<Match[]>>(`${this.baseUrl}/tournament/${tournamentId}`)
      .pipe(map((res) => res.data));
  }
}
