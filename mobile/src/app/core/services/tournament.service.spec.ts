import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TournamentService } from './tournament.service';
import { environment } from '../../../environments/environment';
import { TournamentDetail, TournamentRequest, TournamentSummary } from '../models/tournament.model';

describe('TournamentService', () => {
  let service: TournamentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TournamentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches the organizer tournaments and unwraps ApiResponse', () => {
    const tournaments: TournamentSummary[] = [
      {
        id: 1,
        name: 'Coupe des vacances',
        sport: 'Football',
        category: 'Senior',
        location: 'Marseille',
        startDate: '2026-08-01',
        endDate: '2026-08-02',
        status: 'ONGOING',
        maxTeams: 16,
        teamsCount: 12,
        format: null,
      },
    ];

    let result: TournamentSummary[] | undefined;
    service.getMine().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: tournaments });

    expect(result).toEqual(tournaments);
  });

  it('fetches the referee join info for a tournament', () => {
    let result: { token: string; joinUrl: string } | undefined;
    service.getRefereeJoinInfo(1).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/1/referee-token`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { token: 'abc123', joinUrl: 'http://localhost:8100/join/abc123' } });

    expect(result).toEqual({ token: 'abc123', joinUrl: 'http://localhost:8100/join/abc123' });
  });

  it('regenerates the referee join token', () => {
    let result: { token: string; joinUrl: string } | undefined;
    service.regenerateRefereeJoinToken(1).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/1/referee-token/regenerate`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: { token: 'new-token', joinUrl: 'http://localhost:8100/join/new-token' } });

    expect(result?.token).toBe('new-token');
  });

  it('fetches a tournament detail by id', () => {
    const detail: TournamentDetail = {
      id: 1,
      name: 'Coupe des vacances',
      sport: 'Football',
      category: 'Senior',
      location: 'Marseille',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      status: 'ONGOING',
      maxTeams: 16,
      format: null,
      description: null,
      terrains: null,
      teams: [],
      matches: [],
    };

    let result: TournamentDetail | undefined;
    service.getById(1).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: detail });

    expect(result).toEqual(detail);
  });

  it('creates a tournament', () => {
    const payload: TournamentRequest = {
      name: 'Coupe des vacances',
      sport: 'football',
      category: 'u15',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      maxTeams: 14,
    };
    const created: TournamentSummary = {
      id: 5,
      name: payload.name,
      sport: payload.sport,
      category: payload.category,
      location: null,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: 'UPCOMING',
      maxTeams: payload.maxTeams,
      teamsCount: 0,
      format: null,
    };

    let result: TournamentSummary | undefined;
    service.create(payload).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: created });

    expect(result).toEqual(created);
  });

  it('updates a tournament', () => {
    let result: TournamentSummary | undefined;
    service.update(1, { location: 'Lyon' }).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ location: 'Lyon' });
    req.flush({
      data: {
        id: 1,
        name: 'Coupe des vacances',
        sport: 'Football',
        category: 'Senior',
        location: 'Lyon',
        startDate: '2026-08-01',
        endDate: '2026-08-02',
        status: 'ONGOING',
        maxTeams: 16,
        teamsCount: 12,
        format: null,
      },
    });

    expect(result?.location).toBe('Lyon');
  });

  it('deletes a tournament', () => {
    let result: { success: boolean } | undefined;
    service.delete(1).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: { success: true } });

    expect(result).toEqual({ success: true });
  });
});
