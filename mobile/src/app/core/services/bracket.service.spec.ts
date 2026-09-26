import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BracketService } from './bracket.service';
import { environment } from '../../../environments/environment';
import { Match } from '../models/match.model';
import { BracketAdvanceResponse } from '../models/tournament.model';

describe('BracketService', () => {
  let service: BracketService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BracketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('generates a bracket with a group count for GROUP_KNOCKOUT', () => {
    let result: Match[] | undefined;
    service.generate(7, 'GROUP_KNOCKOUT', 4).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/7/bracket`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ format: 'GROUP_KNOCKOUT', groupCount: 4 });
    req.flush({ data: [] });

    expect(result).toEqual([]);
  });

  it('generates a bracket without a group count for other formats', () => {
    service.generate(7, 'SINGLE_ELIMINATION').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/7/bracket`);
    expect(req.request.body).toEqual({ format: 'SINGLE_ELIMINATION', groupCount: undefined });
    req.flush({ data: [] });
  });

  it('advances to the next round', () => {
    const response: BracketAdvanceResponse = { matches: [], tournamentComplete: false, champion: null };

    let result: BracketAdvanceResponse | undefined;
    service.advance(7).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/7/bracket/advance`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: response });

    expect(result).toEqual(response);
  });
});
