import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { TournamentSessionService } from './tournament-session.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let tournamentSessionServiceSpy: jasmine.SpyObj<TournamentSessionService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'restoreSession']);
    tournamentSessionServiceSpy = jasmine.createSpyObj('TournamentSessionService', ['isActive', 'restoreSession']);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
    authServiceSpy.restoreSession.and.resolveTo();
    tournamentSessionServiceSpy.restoreSession.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TournamentSessionService, useValue: tournamentSessionServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
  }

  // authGuard attend explicitement restoreSession() (voir le commentaire dans auth.guard.ts) —
  // le résultat est donc une Promise même quand isAuthenticated()/isActive() sont synchrones.

  it('allows navigation when authenticated as a real user', async () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    tournamentSessionServiceSpy.isActive.and.returnValue(false);

    expect(await runGuard()).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('allows navigation with an active tournament session (QR-joined referee)', async () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    tournamentSessionServiceSpy.isActive.and.returnValue(true);

    expect(await runGuard()).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to /login when neither is active', async () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    tournamentSessionServiceSpy.isActive.and.returnValue(false);
    const urlTree = {} as UrlTree;
    routerSpy.createUrlTree.and.returnValue(urlTree);

    expect(await runGuard()).toBe(urlTree);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
