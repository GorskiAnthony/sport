import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { BracketAdvanceResponse, TournamentFormat } from '../models/tournament.model';
import { Match } from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class BracketService {
  private readonly http = inject(HttpClient);

  private bracketUrl(tournamentId: number): string {
    return `${environment.apiUrl}/tournaments/${tournamentId}/bracket`;
  }

  generate(tournamentId: number, format: TournamentFormat, groupCount?: number): Observable<Match[]> {
    return this.http
      .post<ApiResponse<Match[]>>(this.bracketUrl(tournamentId), { format, groupCount })
      .pipe(map((res) => res.data));
  }

  advance(tournamentId: number): Observable<BracketAdvanceResponse> {
    return this.http
      .post<ApiResponse<BracketAdvanceResponse>>(`${this.bracketUrl(tournamentId)}/advance`, {})
      .pipe(map((res) => res.data));
  }
}
