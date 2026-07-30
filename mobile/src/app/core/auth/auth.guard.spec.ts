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
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    tournamentSessionServiceSpy = jasmine.createSpyObj('TournamentSessionService', ['isActive']);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

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

  it('allows navigation when authenticated as a real user', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    tournamentSessionServiceSpy.isActive.and.returnValue(false);

    expect(runGuard()).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('allows navigation with an active tournament session (QR-joined referee)', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    tournamentSessionServiceSpy.isActive.and.returnValue(true);

    expect(runGuard()).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to /login when neither is active', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    tournamentSessionServiceSpy.isActive.and.returnValue(false);
    const urlTree = {} as UrlTree;
    routerSpy.createUrlTree.and.returnValue(urlTree);

    expect(runGuard()).toBe(urlTree);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
