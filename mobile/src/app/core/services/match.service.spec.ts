import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatchService } from './match.service';
import { environment } from '../../../environments/environment';
import { Match } from '../models/match.model';

describe('MatchService', () => {
  let service: MatchService;
  let httpMock: HttpTestingController;

  const match: Match = {
    id: 1,
    tournamentId: 42,
    tournamentName: 'Coupe des vacances',
    homeTeam: { id: 1, name: 'Les Aigles' },
    awayTeam: { id: 2, name: 'Les Lions' },
    homeScore: 2,
    awayScore: 1,
    forfeitedTeamId: null,
    refereeId: 9,
    phase: 'Poule A',
    date: '2026-08-01T10:00:00Z',
    venue: 'Terrain 1',
    status: 'ONGOING',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MatchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches the matches of a tournament and unwraps ApiResponse', () => {
    let result: Match[] | undefined;
    service.getByTournament(42).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/matches/tournament/42`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [match] });

    expect(result).toEqual([match]);
  });

  it('fetches a single match by id', () => {
    let result: Match | undefined;
    service.getById(1).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/matches/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: match });

    expect(result).toEqual(match);
  });

  it('fetches the matches assigned to the current referee', () => {
    let result: Match[] | undefined;
    service.getMine().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/matches/mine`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [match] });

    expect(result).toEqual([match]);
  });

  it('starts a match', () => {
    let result: Match | undefined;
    service.start(1).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/matches/1/start`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: { ...match, status: 'ONGOING' } });

    expect(result?.status).toBe('ONGOING');
  });

  it('submits the final score', () => {
    let result: Match | undefined;
    service.updateScore(1, { homeScore: 3, awayScore: 1 }).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/matches/1/score`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ homeScore: 3, awayScore: 1 });
    req.flush({ data: { ...match, homeScore: 3, awayScore: 1, status: 'FINISHED' } });

    expect(result?.status).toBe('FINISHED');
  });
});
