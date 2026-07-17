import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardHomePage } from './dashboard-home';
import { OrganizerDashboardStats } from '../../../core/models/dashboard-stats.model';

const STATS_RESPONSE: OrganizerDashboardStats = {
  tournaments: { total: 2, upcoming: 1, ongoing: 1, finished: 0 },
  teamsCount: 10,
  matches: { total: 5, scheduled: 3, ongoing: 0, finished: 2 },
  plan: {
    plan: 'FREE',
    usedTournaments: 2,
    maxTournaments: 1,
    maxTeamsPerTournament: 14,
    realtimeEnabled: false,
    customRulesEnabled: false,
  },
  upcomingMatches: [],
};

describe('DashboardHomePage', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardHomePage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads organizer stats on init and clears the loading state', () => {
    const fixture = TestBed.createComponent(DashboardHomePage);
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url.endsWith('/dashboard/organizer'));
    req.flush({ data: STATS_RESPONSE });

    expect(fixture.componentInstance.stats()).toEqual(STATS_RESPONSE);
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe(false);
  });

  it('sets the error state and clears loading when the request fails', () => {
    const fixture = TestBed.createComponent(DashboardHomePage);
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url.endsWith('/dashboard/organizer'));
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(fixture.componentInstance.error()).toBe(true);
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.stats()).toBeNull();
  });
});
