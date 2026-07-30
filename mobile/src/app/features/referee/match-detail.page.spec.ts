import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatchService } from '../../core/services/match.service';
import { MatchDetailPage } from './match-detail.page';
import { Match } from '../../core/models/match.model';

describe('MatchDetailPage', () => {
  let matchServiceSpy: jasmine.SpyObj<MatchService>;

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
    matchServiceSpy = jasmine.createSpyObj('MatchService', ['getById', 'start', 'updateScore']);

    await TestBed.configureTestingModule({
      imports: [MatchDetailPage],
      providers: [
        { provide: MatchService, useValue: matchServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    }).compileComponents();
  });

  function createPage(): MatchDetailPage {
    const fixture = TestBed.createComponent(MatchDetailPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    return page;
  }

  it('loads the match for the id from the route and seeds the score counters', () => {
    matchServiceSpy.getById.and.returnValue(of(buildMatch({ homeScore: 2, awayScore: 1, status: 'ONGOING' })));

    const page = createPage();

    expect(matchServiceSpy.getById).toHaveBeenCalledWith(1);
    expect(page.homeScore()).toBe(2);
    expect(page.awayScore()).toBe(1);
    expect(page.loading()).toBeFalse();
  });

  it('defaults the counters to 0 when the match has no score yet', () => {
    matchServiceSpy.getById.and.returnValue(of(buildMatch({})));

    const page = createPage();

    expect(page.homeScore()).toBe(0);
    expect(page.awayScore()).toBe(0);
  });

  it('surfaces an error state when the request fails', () => {
    matchServiceSpy.getById.and.returnValue(throwError(() => new Error('down')));

    const page = createPage();

    expect(page.error()).toBeTrue();
    expect(page.loading()).toBeFalse();
  });

  it('starts the match and reflects the new status', () => {
    matchServiceSpy.getById.and.returnValue(of(buildMatch({})));
    matchServiceSpy.start.and.returnValue(of(buildMatch({ status: 'ONGOING' })));
    const page = createPage();

    page.start();

    expect(matchServiceSpy.start).toHaveBeenCalledWith(1);
    expect(page.match()?.status).toBe('ONGOING');
    expect(page.starting()).toBeFalse();
  });

  it('increments and decrements the score counters, never going below 0', () => {
    matchServiceSpy.getById.and.returnValue(of(buildMatch({ status: 'ONGOING' })));
    const page = createPage();

    page.incrementHome();
    page.incrementHome();
    page.decrementHome();
    expect(page.homeScore()).toBe(1);

    page.decrementAway();
    expect(page.awayScore()).toBe(0);
  });

  it('submits the final score and reflects the FINISHED status returned by the server', () => {
    matchServiceSpy.getById.and.returnValue(of(buildMatch({ status: 'ONGOING' })));
    const page = createPage();
    page.incrementHome();
    page.incrementHome();
    page.incrementAway();

    matchServiceSpy.updateScore.and.returnValue(
      of(buildMatch({ status: 'FINISHED', homeScore: 2, awayScore: 1 })),
    );
    page.finish();

    expect(matchServiceSpy.updateScore).toHaveBeenCalledWith(1, { homeScore: 2, awayScore: 1 });
    expect(page.match()?.status).toBe('FINISHED');
    expect(page.submitting()).toBeFalse();
  });

  it('maps status to the design-system label and color', () => {
    matchServiceSpy.getById.and.returnValue(of(buildMatch({})));
    const page = createPage();

    expect(page.statusLabel('SCHEDULED')).toBe('À venir');
    expect(page.statusColor('SCHEDULED')).toBe('warning');
    expect(page.statusLabel('FORFEIT')).toBe('Forfait');
    expect(page.statusColor('FORFEIT')).toBe('danger');
  });
});
