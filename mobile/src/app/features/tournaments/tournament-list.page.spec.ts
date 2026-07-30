import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentListPage } from './tournament-list.page';
import { TournamentSummary } from '../../core/models/tournament.model';

describe('TournamentListPage', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;
  let routerSpy: jasmine.SpyObj<Router>;

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

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    tournamentServiceSpy = jasmine.createSpyObj('TournamentService', ['getMine']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TournamentListPage],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TournamentService, useValue: tournamentServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  });

  function createPage(): TournamentListPage {
    const fixture = TestBed.createComponent(TournamentListPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    return page;
  }

  it('loads the organizer tournaments when the view is entered', () => {
    tournamentServiceSpy.getMine.and.returnValue(of(tournaments));

    const page = createPage();

    expect(page.tournaments()).toEqual(tournaments);
    expect(page.loading()).toBeFalse();
    expect(page.error()).toBeFalse();
  });

  it('surfaces an error state when the request fails', () => {
    tournamentServiceSpy.getMine.and.returnValue(throwError(() => new Error('network down')));

    const page = createPage();

    expect(page.error()).toBeTrue();
    expect(page.loading()).toBeFalse();
    expect(page.tournaments()).toEqual([]);
  });

  it('retries the load when load() is called again', () => {
    tournamentServiceSpy.getMine.and.returnValue(of(tournaments));
    const page = createPage();

    tournamentServiceSpy.getMine.calls.reset();
    page.load();

    expect(tournamentServiceSpy.getMine).toHaveBeenCalledTimes(1);
  });

  it('reloads on every ionViewWillEnter, not just the first — Ionic caches the page instance on back navigation instead of recreating it', () => {
    tournamentServiceSpy.getMine.and.returnValue(of(tournaments));
    const page = createPage();

    tournamentServiceSpy.getMine.calls.reset();
    page.ionViewWillEnter();

    expect(tournamentServiceSpy.getMine).toHaveBeenCalledTimes(1);
  });

  it('completes the refresher and updates the list on pull-to-refresh', () => {
    tournamentServiceSpy.getMine.and.returnValue(of(tournaments));
    const page = createPage();

    const completeSpy = jasmine.createSpy('complete');
    const event = { target: { complete: completeSpy } } as unknown as Parameters<typeof page.refresh>[0];

    page.refresh(event);

    expect(completeSpy).toHaveBeenCalled();
    expect(page.tournaments()).toEqual(tournaments);
  });

  it('opens the referee code screen and stops the row click from also firing', () => {
    tournamentServiceSpy.getMine.and.returnValue(of([]));
    const page = createPage();
    const event = jasmine.createSpyObj('Event', ['stopPropagation']);

    page.openRefereeCode(event, 42);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tournaments', 42, 'referee-code']);
  });

  it('logs out and navigates to /login', () => {
    tournamentServiceSpy.getMine.and.returnValue(of([]));
    const page = createPage();

    page.logout();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('navigates to the live score screen when a tournament is opened', () => {
    tournamentServiceSpy.getMine.and.returnValue(of([]));
    const page = createPage();

    page.openLive(42);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tournaments', 42, 'live']);
  });

  it('maps status to the design-system label and color', () => {
    tournamentServiceSpy.getMine.and.returnValue(of([]));
    const page = createPage();

    expect(page.statusLabel('ONGOING')).toBe('En cours');
    expect(page.statusColor('ONGOING')).toBe('primary');
    expect(page.statusLabel('UPCOMING')).toBe('À venir');
    expect(page.statusColor('UPCOMING')).toBe('warning');
    expect(page.statusLabel('FINISHED')).toBe('Terminé');
    expect(page.statusColor('FINISHED')).toBe('medium');
  });
});
