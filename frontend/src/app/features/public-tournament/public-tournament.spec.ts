import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { PublicTournamentPage } from './public-tournament';
import { TournamentService } from '../../core/services/tournament.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LiveUpdateService } from '../../core/services/live-update.service';
import { TournamentDetail } from '../../core/models/tournament.model';

const TOURNAMENT: TournamentDetail = {
  id: 42,
  name: 'Coupe Test',
  sport: 'football',
  category: 'Senior',
  location: 'Paris',
  startDate: '2026-08-01',
  endDate: '2026-08-10',
  status: 'ONGOING',
  maxTeams: 8,
  description: null,
  format: null,
  icon: null,
  splitEnabled: false,
  organizerId: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  teams: [],
  matches: [],
};

/** Only tests the one piece of new conditional client logic this feature adds: recordView
 *  must fire exactly once on the initial load, and only when the visitor is authenticated —
 *  a regression here would either spam the endpoint or silently stop recording history. */
describe('PublicTournamentPage recordView hook', () => {
  function setup(isAuthenticated: boolean) {
    const recordView = vi.fn().mockReturnValue(of(undefined));
    const tournamentServiceStub = {
      getById: vi.fn().mockReturnValue(of(TOURNAMENT)),
      recordView,
    };
    const authServiceStub = { isAuthenticated: () => isAuthenticated };

    TestBed.configureTestingModule({
      imports: [PublicTournamentPage],
      providers: [
        { provide: TournamentService, useValue: tournamentServiceStub },
        { provide: TeamService, useValue: { isFollowing: vi.fn().mockReturnValue(of({ following: false })) } },
        { provide: AuthService, useValue: authServiceStub },
        { provide: ToastService, useValue: {} },
        { provide: LiveUpdateService, useValue: { subscribeToTournament: () => () => {} } },
        { provide: Router, useValue: { navigate: vi.fn(), url: '/t/42' } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '42' } } },
        },
      ],
    });

    const fixture = TestBed.createComponent(PublicTournamentPage);
    fixture.detectChanges();
    return { recordView };
  }

  it('records a view once on initial load when authenticated', () => {
    const { recordView } = setup(true);
    expect(recordView).toHaveBeenCalledTimes(1);
    expect(recordView).toHaveBeenCalledWith(42);
  });

  it('never records a view when the visitor is not authenticated', () => {
    const { recordView } = setup(false);
    expect(recordView).not.toHaveBeenCalled();
  });
});
