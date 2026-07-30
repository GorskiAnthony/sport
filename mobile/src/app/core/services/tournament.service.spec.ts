import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TournamentService } from './tournament.service';
import { environment } from '../../../environments/environment';
import { TournamentSummary } from '../models/tournament.model';

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
      },
    ];

    let result: TournamentSummary[] | undefined;
    service.getMine().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: tournaments });

    expect(result).toEqual(tournaments);
  });
});
