import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { MatchService } from '../../core/services/match.service';
import { LiveUpdateService } from '../../core/services/live-update.service';
import { LiveScorePage } from './live-score.page';
import { Match } from '../../core/models/match.model';

describe('LiveScorePage', () => {
  let matchServiceSpy: jasmine.SpyObj<MatchService>;
  let liveUpdateServiceSpy: jasmine.SpyObj<LiveUpdateService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let unsubscribeSpy: jasmine.Spy;

  const matches: Match[] = [
    {
      id: 1,
      tournamentId: 7,
      tournamentName: 'Coupe des vacances',
      homeTeam: { id: 1, name: 'Les Aigles', club: null, logo: null, category: 'U15', contact: null, tournamentId: 7, createdAt: '', updatedAt: '' },
      awayTeam: { id: 2, name: 'Les Lions', club: null, logo: null, category: 'U15', contact: null, tournamentId: 7, createdAt: '', updatedAt: '' },
      homeScore: 1,
      awayScore: 0,
      homeFairPlay: null,
      awayFairPlay: null,
      forfeitedTeamId: null,
      phase: 'Poule A',
      date: '2026-08-01T10:00:00Z',
      venue: 'Terrain 1',
      status: 'ONGOING',
    },
  ];

  beforeEach(async () => {
    matchServiceSpy = jasmine.createSpyObj('MatchService', ['getByTournament']);
    unsubscribeSpy = jasmine.createSpy('unsubscribe');
    liveUpdateServiceSpy = jasmine.createSpyObj('LiveUpdateService', ['subscribeToTournament']);
    liveUpdateServiceSpy.subscribeToTournament.and.returnValue(unsubscribeSpy);
    // NavController (derrière ion-back-button) s'abonne à router.events dès sa création — un
    // spy Router sans cette propriété fait planter le rendu du template avec une TypeError.
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: EMPTY });

    await TestBed.configureTestingModule({
      imports: [LiveScorePage],
      providers: [
        { provide: MatchService, useValue: matchServiceSpy },
        { provide: LiveUpdateService, useValue: liveUpdateServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } },
        },
      ],
    }).compileComponents();
  });

  function createPage(): LiveScorePage {
    const fixture = TestBed.createComponent(LiveScorePage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    return page;
  }

  it('loads the matches for the tournament id from the route', () => {
    matchServiceSpy.getByTournament.and.returnValue(of(matches));

    createPage();

    expect(matchServiceSpy.getByTournament).toHaveBeenCalledWith(7);
  });

  it('exposes the loaded matches and clears loading/error', () => {
    matchServiceSpy.getByTournament.and.returnValue(of(matches));

    const page = createPage();

    expect(page.matches()).toEqual(matches);
    expect(page.loading()).toBeFalse();
    expect(page.error()).toBeFalse();
  });

  it('surfaces an error state when the request fails', () => {
    matchServiceSpy.getByTournament.and.returnValue(throwError(() => new Error('down')));

    const page = createPage();

    expect(page.error()).toBeTrue();
    expect(page.loading()).toBeFalse();
  });

  it('subscribes to live updates for the tournament and reloads on update', () => {
    matchServiceSpy.getByTournament.and.returnValue(of(matches));
    createPage();

    expect(liveUpdateServiceSpy.subscribeToTournament).toHaveBeenCalledWith(7, jasmine.any(Function));

    matchServiceSpy.getByTournament.calls.reset();
    const onUpdate = liveUpdateServiceSpy.subscribeToTournament.calls.mostRecent().args[1] as () => void;
    onUpdate();

    expect(matchServiceSpy.getByTournament).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from live updates when the view is left', () => {
    matchServiceSpy.getByTournament.and.returnValue(of(matches));
    const page = createPage();

    page.ionViewWillLeave();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('resubscribes on every ionViewWillEnter, not just the first — Ionic caches the page instance on back navigation instead of recreating it', () => {
    matchServiceSpy.getByTournament.and.returnValue(of(matches));
    const page = createPage();

    liveUpdateServiceSpy.subscribeToTournament.calls.reset();
    page.ionViewWillEnter();

    expect(liveUpdateServiceSpy.subscribeToTournament).toHaveBeenCalledTimes(1);
  });

  it('navigates to the shared match detail screen when a match is opened', () => {
    matchServiceSpy.getByTournament.and.returnValue(of(matches));
    const page = createPage();

    page.openMatch(42);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/matches', 42]);
  });

  it('maps status to the design-system label and color', () => {
    matchServiceSpy.getByTournament.and.returnValue(of([]));
    const page = createPage();

    expect(page.statusLabel('ONGOING')).toBe('En direct');
    expect(page.statusColor('ONGOING')).toBe('primary');
    expect(page.statusLabel('FORFEIT')).toBe('Forfait');
    expect(page.statusColor('FORFEIT')).toBe('danger');
  });
});
