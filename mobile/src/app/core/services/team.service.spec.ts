import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TeamService } from './team.service';
import { environment } from '../../../environments/environment';
import { Team, TeamRequest } from '../models/team.model';

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;

  const team: Team = {
    id: 1,
    name: 'Les Aigles',
    club: null,
    logo: null,
    category: 'U15',
    contact: null,
    tournamentId: 7,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches the teams of a tournament', () => {
    let result: Team[] | undefined;
    service.getByTournament(7).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/teams/tournament/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [team] });

    expect(result).toEqual([team]);
  });

  it('creates a team', () => {
    const payload: TeamRequest = { name: 'Les Aigles', category: 'U15', tournamentId: 7 };

    let result: Team | undefined;
    service.create(payload).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/teams`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: team });

    expect(result).toEqual(team);
  });

  it('updates a team', () => {
    let result: Team | undefined;
    service.update(1, { name: 'Les Renards' }).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/teams/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Les Renards' });
    req.flush({ data: { ...team, name: 'Les Renards' } });

    expect(result?.name).toBe('Les Renards');
  });

  it('deletes a team', () => {
    let result: { success: boolean } | undefined;
    service.delete(1).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/teams/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: { success: true } });

    expect(result).toEqual({ success: true });
  });
});
