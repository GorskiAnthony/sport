import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TournamentSessionService } from './tournament-session.service';
import { TournamentSessionStorageService } from './tournament-session-storage.service';
import { environment } from '../../../environments/environment';

describe('TournamentSessionService', () => {
  let service: TournamentSessionService;
  let httpMock: HttpTestingController;
  let storageSpy: jasmine.SpyObj<TournamentSessionStorageService>;

  const joinResponse = { sessionToken: 'session-jwt', tournamentId: 10, tournamentName: 'Coupe des vacances' };

  beforeEach(() => {
    storageSpy = jasmine.createSpyObj('TournamentSessionStorageService', ['get', 'set', 'clear']);
    storageSpy.set.and.resolveTo();
    storageSpy.clear.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TournamentSessionStorageService, useValue: storageSpy },
      ],
    });
    service = TestBed.inject(TournamentSessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts inactive with no cached session', () => {
    expect(service.isActive()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('joins a tournament and persists the session, with an optional referee name', () => {
    service.join('qr-token', 'Jean').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments/join`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'qr-token', refereeName: 'Jean' });
    req.flush({ data: joinResponse });

    expect(service.isActive()).toBeTrue();
    expect(service.getToken()).toBe('session-jwt');
    expect(service.tournamentId()).toBe(10);
    expect(service.tournamentName()).toBe('Coupe des vacances');
    expect(service.refereeName()).toBe('Jean');
    expect(storageSpy.set).toHaveBeenCalledWith(jasmine.any(String));
  });

  it('joins anonymously when no name is given', () => {
    service.join('qr-token').subscribe();

    httpMock.expectOne(`${environment.apiUrl}/tournaments/join`).flush({ data: joinResponse });

    expect(service.refereeName()).toBeNull();
  });

  it('restores a previously persisted session from storage', async () => {
    storageSpy.get.and.resolveTo(
      JSON.stringify({ sessionToken: 'stored-jwt', tournamentId: 5, tournamentName: 'Tournoi X', refereeName: null }),
    );

    await service.restoreSession();

    expect(service.getToken()).toBe('stored-jwt');
    expect(service.isActive()).toBeTrue();
    expect(service.tournamentId()).toBe(5);
  });

  it('stays inactive when storage has nothing saved', async () => {
    storageSpy.get.and.resolveTo(null);

    await service.restoreSession();

    expect(service.isActive()).toBeFalse();
  });

  it('clears the session', () => {
    service.join('qr-token').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/tournaments/join`).flush({ data: joinResponse });

    service.clear();

    expect(service.isActive()).toBeFalse();
    expect(service.getToken()).toBeNull();
    expect(storageSpy.clear).toHaveBeenCalled();
  });
});
