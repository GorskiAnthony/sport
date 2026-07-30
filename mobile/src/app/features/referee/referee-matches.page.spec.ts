import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { MatchService } from '../../core/services/match.service';
import { RefereeMatchesPage } from './referee-matches.page';
import { Match } from '../../core/models/match.model';

describe('RefereeMatchesPage', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let matchServiceSpy: jasmine.SpyObj<MatchService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function buildMatch(overrides: Partial<Match>): Match {
    return {
      id: 1,
      tournamentId: 7,
      tournamentName: 'Coupe des vacances',
      homeTeam: { id: 1, name: 'Les Aigles' },
      awayTeam: { id: 2, name: 'Les Lions' },
      homeScore: null,
      awayScore: null,
      forfeitedTeamId: null,
      refereeId: 9,
      phase: 'Poule A',
      date: '2026-08-01T10:00:00Z',
      venue: 'Terrain 1',
      status: 'SCHEDULED',
      ...overrides,
    };
  }

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    matchServiceSpy = jasmine.createSpyObj('MatchService', ['getMine']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RefereeMatchesPage],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatchService, useValue: matchServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  });

  function createPage(): RefereeMatchesPage {
    const fixture = TestBed.createComponent(RefereeMatchesPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    return page;
  }

  it('splits matches into actionable (scheduled/ongoing) and done (finished/forfeit)', () => {
    const matches = [
      buildMatch({ id: 1, status: 'FINISHED', date: '2026-08-01T09:00:00Z' }),
      buildMatch({ id: 2, status: 'ONGOING', date: '2026-08-01T11:00:00Z' }),
      buildMatch({ id: 3, status: 'SCHEDULED', date: '2026-08-01T10:00:00Z' }),
      buildMatch({ id: 4, status: 'FORFEIT', date: '2026-08-01T08:00:00Z' }),
    ];
    matchServiceSpy.getMine.and.returnValue(of(matches));

    const page = createPage();

    expect(page.toHandle().map((m) => m.id)).toEqual([3, 2]);
    expect(page.done().map((m) => m.id)).toEqual([4, 1]);
  });

  it('reloads on every ionViewWillEnter, not just the first — Ionic caches the page instance on back navigation instead of recreating it', () => {
    matchServiceSpy.getMine.and.returnValue(of([buildMatch({})]));
    const page = createPage();

    matchServiceSpy.getMine.calls.reset();
    page.ionViewWillEnter();

    expect(matchServiceSpy.getMine).toHaveBeenCalledTimes(1);
  });

  it('surfaces an error state when the request fails', () => {
    matchServiceSpy.getMine.and.returnValue(throwError(() => new Error('down')));

    const page = createPage();

    expect(page.error()).toBeTrue();
    expect(page.loading()).toBeFalse();
  });

  it('completes the refresher and updates the list on pull-to-refresh', () => {
    matchServiceSpy.getMine.and.returnValue(of([buildMatch({})]));
    const page = createPage();

    const completeSpy = jasmine.createSpy('complete');
    const event = { target: { complete: completeSpy } } as unknown as Parameters<typeof page.refresh>[0];
    page.refresh(event);

    expect(completeSpy).toHaveBeenCalled();
    expect(page.toHandle()).toHaveSize(1);
  });

  it('navigates to the match detail screen when a match is opened', () => {
    matchServiceSpy.getMine.and.returnValue(of([]));
    const page = createPage();

    page.openMatch(5);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/matches', 5]);
  });

  it('logs out and navigates to /login', () => {
    matchServiceSpy.getMine.and.returnValue(of([]));
    const page = createPage();

    page.logout();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('maps status to the design-system label and color', () => {
    matchServiceSpy.getMine.and.returnValue(of([]));
    const page = createPage();

    expect(page.statusLabel('SCHEDULED')).toBe('À venir');
    expect(page.statusColor('SCHEDULED')).toBe('warning');
    expect(page.statusLabel('ONGOING')).toBe('En cours');
    expect(page.statusColor('ONGOING')).toBe('primary');
    expect(page.statusLabel('FORFEIT')).toBe('Forfait');
    expect(page.statusColor('FORFEIT')).toBe('danger');
  });
});
