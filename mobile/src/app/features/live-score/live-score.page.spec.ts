import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatchService } from '../../core/services/match.service';
import { LiveUpdateService } from '../../core/services/live-update.service';
import { LiveScorePage } from './live-score.page';
import { Match } from '../../core/models/match.model';

describe('LiveScorePage', () => {
  let matchServiceSpy: jasmine.SpyObj<MatchService>;
  let liveUpdateServiceSpy: jasmine.SpyObj<LiveUpdateService>;
  let unsubscribeSpy: jasmine.Spy;

  const matches: Match[] = [
    {
      id: 1,
      tournamentId: 7,
      homeTeam: { id: 1, name: 'Les Aigles' },
      awayTeam: { id: 2, name: 'Les Lions' },
      homeScore: 1,
      awayScore: 0,
      forfeitedTeamId: null,
      phase: 'Poule A',
      status: 'ONGOING',
    },
  ];

  beforeEach(async () => {
    matchServiceSpy = jasmine.createSpyObj('MatchService', ['getByTournament']);
    unsubscribeSpy = jasmine.createSpy('unsubscribe');
    liveUpdateServiceSpy = jasmine.createSpyObj('LiveUpdateService', ['subscribeToTournament']);
    liveUpdateServiceSpy.subscribeToTournament.and.returnValue(unsubscribeSpy);

    await TestBed.configureTestingModule({
      imports: [LiveScorePage],
      providers: [
        { provide: MatchService, useValue: matchServiceSpy },
        { provide: LiveUpdateService, useValue: liveUpdateServiceSpy },
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
    return fixture.componentInstance;
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

  it('unsubscribes from live updates on destroy', () => {
    matchServiceSpy.getByTournament.and.returnValue(of(matches));
    const fixture = TestBed.createComponent(LiveScorePage);
    fixture.detectChanges();

    fixture.destroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
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
