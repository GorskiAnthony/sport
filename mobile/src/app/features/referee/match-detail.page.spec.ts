import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
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
    matchServiceSpy = jasmine.createSpyObj('MatchService', ['getById', 'start', 'recordGoal', 'updateScore']);

    await TestBed.configureTestingModule({
      imports: [MatchDetailPage],
      providers: [
        { provide: MatchService, useValue: matchServiceSpy },
        // Le fil d'Ariane de l'en-tête (voir shared/ui/breadcrumb) utilise routerLink, qui a
        // besoin d'un vrai Router pour calculer son href — voir login.page.spec.ts pour la
        // même raison.
        provideRouter([]),
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

  it('sends a goal immediately on tap and reconciles with the server response', () => {
    matchServiceSpy.getById.and.returnValue(of(buildMatch({ status: 'ONGOING', homeScore: 0, awayScore: 0 })));
    matchServiceSpy.recordGoal.and.returnValue(of(buildMatch({ status: 'ONGOING', homeScore: 1, awayScore: 0 })));
    const page = createPage();

    page.incrementHome();

    expect(matchServiceSpy.recordGoal).toHaveBeenCalledWith(1, 'HOME', 1);
    expect(page.homeScore()).toBe(1);
  });

  it('rolls back the optimistic update when the goal request fails', () => {
    matchServiceSpy.getById.and.returnValue(of(buildMatch({ status: 'ONGOING', homeScore: 0, awayScore: 0 })));
    matchServiceSpy.recordGoal.and.returnValue(throwError(() => new Error('down')));
    const page = createPage();

    page.incrementAway();

    expect(page.awayScore()).toBe(0);
  });

  it('never decrements a counter below 0, and does not call the server for a no-op decrement', () => {
    matchServiceSpy.getById.and.returnValue(of(buildMatch({ status: 'ONGOING', homeScore: 0, awayScore: 0 })));
    const page = createPage();

    page.decrementHome();

    expect(page.homeScore()).toBe(0);
    expect(matchServiceSpy.recordGoal).not.toHaveBeenCalled();
  });

  it('submits the current server-confirmed totals to finish the match', () => {
    matchServiceSpy.getById.and.returnValue(of(buildMatch({ status: 'ONGOING', homeScore: 2, awayScore: 1 })));
    const page = createPage();

    matchServiceSpy.updateScore.and.returnValue(of(buildMatch({ status: 'FINISHED', homeScore: 2, awayScore: 1 })));
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
