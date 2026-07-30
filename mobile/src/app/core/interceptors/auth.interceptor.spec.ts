import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../auth/auth.service';
import { TournamentSessionService } from '../auth/tournament-session.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let tournamentSessionServiceSpy: jasmine.SpyObj<TournamentSessionService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    tournamentSessionServiceSpy = jasmine.createSpyObj('TournamentSessionService', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TournamentSessionService, useValue: tournamentSessionServiceSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds the Authorization header from the user token when present', () => {
    authServiceSpy.getToken.and.returnValue('jwt-token');

    http.get('/api/tournaments/me').subscribe();

    const req = httpMock.expectOne('/api/tournaments/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({});
  });

  it('falls back to the tournament session token when there is no user token', () => {
    authServiceSpy.getToken.and.returnValue(null);
    tournamentSessionServiceSpy.getToken.and.returnValue('session-jwt');

    http.get('/api/matches/1').subscribe();

    const req = httpMock.expectOne('/api/matches/1');
    expect(req.request.headers.get('Authorization')).toBe('Bearer session-jwt');
    req.flush({});
  });

  it('leaves the request untouched when neither token is present', () => {
    authServiceSpy.getToken.and.returnValue(null);
    tournamentSessionServiceSpy.getToken.and.returnValue(null);

    http.get('/api/tournaments/me').subscribe();

    const req = httpMock.expectOne('/api/tournaments/me');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
