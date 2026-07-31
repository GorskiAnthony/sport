import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatchService } from '../../core/services/match.service';
import { LiveUpdateService } from '../../core/services/live-update.service';
import { PlanningPage } from './planning.page';
import { Match } from '../../core/models/match.model';

describe('PlanningPage', () => {
  let matchServiceSpy: jasmine.SpyObj<MatchService>;
  let liveUpdateServiceSpy: jasmine.SpyObj<LiveUpdateService>;
  let router: Router;
  let unsubscribeSpy: jasmine.Spy;

  function buildMatch(overrides: Partial<Match>): Match {
    return {
      id: 1,
      tournamentId: 7,
      tournamentName: 'Coupe des vacances',
      homeTeam: { id: 1, name: 'Les Aigles', club: null, logo: null, category: 'U15', contact: null, tournamentId: 7, createdAt: '', updatedAt: '' },
      awayTeam: { id: 2, name: 'Les Lions', club: null, logo: null, category: 'U15', contact: null, tournamentId: 7, createdAt: '', updatedAt: '' },
      homeScore: null,
      awayScore: null,
      homeFairPlay: null,
      awayFairPlay: null,
      forfeitedTeamId: null,
      phase: 'Poule A',
      date: '2026-08-01T10:00:00Z',
      venue: 'Terrain 1',
      status: 'SCHEDULED',
      ...overrides,
    };
  }

  beforeEach(async () => {
    matchServiceSpy = jasmine.createSpyObj('MatchService', ['getByTournament']);
    unsubscribeSpy = jasmine.createSpy('unsubscribe');
    liveUpdateServiceSpy = jasmine.createSpyObj('LiveUpdateService', ['subscribeToTournament']);
    liveUpdateServiceSpy.subscribeToTournament.and.returnValue(unsubscribeSpy);

    await TestBed.configureTestingModule({
      imports: [PlanningPage],
      providers: [
        { provide: MatchService, useValue: matchServiceSpy },
        { provide: LiveUpdateService, useValue: liveUpdateServiceSpy },
        // Le fil d'Ariane de l'en-tête (voir shared/ui/breadcrumb) utilise routerLink, qui a
        // besoin d'un vrai Router pour calculer son href — voir login.page.spec.ts pour la même
        // raison.
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  function createPage(): PlanningPage {
    const fixture = TestBed.createComponent(PlanningPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    return page;
  }

  it('loads the matches for the tournament id from the route', () => {
    matchServiceSpy.getByTournament.and.returnValue(of([]));

    createPage();

    expect(matchServiceSpy.getByTournament).toHaveBeenCalledWith(7);
  });

  it('surfaces an error state when the request fails', () => {
    matchServiceSpy.getByTournament.and.returnValue(throwError(() => new Error('down')));

    const page = createPage();

    expect(page.error()).toBeTrue();
    expect(page.loading()).toBeFalse();
  });

  it('subscribes to live updates and unsubscribes when the view is left', () => {
    matchServiceSpy.getByTournament.and.returnValue(of([]));
    const page = createPage();

    expect(liveUpdateServiceSpy.subscribeToTournament).toHaveBeenCalledWith(7, jasmine.any(Function));

    page.ionViewWillLeave();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('lists every distinct venue plus "Tous", with a fallback label for matches without one', () => {
    matchServiceSpy.getByTournament.and.returnValue(
      of([buildMatch({ id: 1, venue: 'Terrain B' }), buildMatch({ id: 2, venue: 'Terrain A' }), buildMatch({ id: 3, venue: null })]),
    );

    const page = createPage();

    expect(page.venues()[0]).toBe('Tous');
    expect(page.venues().slice(1)).toEqual(jasmine.arrayWithExactContents(['Terrain A', 'Terrain B', 'Terrain à définir']));
  });

  it('sorts matches chronologically within the selected venue, undated matches last', () => {
    matchServiceSpy.getByTournament.and.returnValue(
      of([
        buildMatch({ id: 1, venue: 'Terrain A', date: '2026-08-01T12:00:00Z' }),
        buildMatch({ id: 2, venue: 'Terrain A', date: null }),
        buildMatch({ id: 3, venue: 'Terrain A', date: '2026-08-01T09:00:00Z' }),
      ]),
    );

    const page = createPage();

    expect(page.filteredMatches().map((m) => m.id)).toEqual([3, 1, 2]);
  });

  it('filters matches down to the selected venue', () => {
    matchServiceSpy.getByTournament.and.returnValue(
      of([buildMatch({ id: 1, venue: 'Terrain A' }), buildMatch({ id: 2, venue: 'Terrain B' })]),
    );
    const page = createPage();

    page.selectVenue('Terrain B');

    expect(page.filteredMatches().map((m) => m.id)).toEqual([2]);
  });

  it('formats the meta line as venue · heure · phase', () => {
    matchServiceSpy.getByTournament.and.returnValue(of([]));
    const page = createPage();

    const meta = page.matchMeta(buildMatch({ venue: 'Terrain A', date: '2026-08-01T09:05:00', phase: 'Poule A' }));

    expect(meta).toBe('Terrain A · 09:05 · Poule A');
  });

  it('navigates to the shared match detail screen when a match is opened', () => {
    matchServiceSpy.getByTournament.and.returnValue(of([]));
    const page = createPage();

    page.openMatch(42);

    expect(router.navigate).toHaveBeenCalledWith(['/matches', 42]);
  });
});
