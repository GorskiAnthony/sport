import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatchService } from './match.service';
import { environment } from '../../../environments/environment';
import { Match } from '../models/match.model';

describe('MatchService', () => {
  let service: MatchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MatchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches the matches of a tournament and unwraps ApiResponse', () => {
    const matches: Match[] = [
      {
        id: 1,
        tournamentId: 42,
        homeTeam: { id: 1, name: 'Les Aigles' },
        awayTeam: { id: 2, name: 'Les Lions' },
        homeScore: 2,
        awayScore: 1,
        forfeitedTeamId: null,
        phase: 'Poule A',
        status: 'ONGOING',
      },
    ];

    let result: Match[] | undefined;
    service.getByTournament(42).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/matches/tournament/42`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: matches });

    expect(result).toEqual(matches);
  });
});
