import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentListPage } from './tournament-list.page';
import { TournamentSummary } from '../../core/models/tournament.model';

describe('TournamentListPage', () => {
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;
  let router: Router;

  const tournaments: TournamentSummary[] = [
    {
      id: 1,
      name: 'Coupe des vacances',
      sport: 'football',
      category: 'Senior',
      location: 'Marseille',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      status: 'ONGOING',
      maxTeams: 16,
      teamsCount: 12,
      format: null,
    },
  ];

  beforeEach(async () => {
    tournamentServiceSpy = jasmine.createSpyObj('TournamentService', ['getMine']);

    await TestBed.configureTestingModule({
      imports: [TournamentListPage],
      providers: [
        { provide: TournamentService, useValue: tournamentServiceSpy },
        // routerLink (bouton "+" et cartes de tournoi) a besoin d'un vrai Router pour calculer
        // ses href — voir login.page.spec.ts pour la même raison.
        provideRouter([]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  function createPage(): TournamentListPage {
    const fixture = TestBed.createComponent(TournamentListPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    return page;
  }

  it('links the header "+" button to the creation wizard', () => {
    tournamentServiceSpy.getMine.and.returnValue(of([]));
    spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(TournamentListPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('[aria-label="Nouveau tournoi"]')).injector.get(RouterLink);
    // Simule le clic qu'intercepte routerLink (voir onClick dans @angular/router) sans dépendre
    // de la propagation d'un vrai événement DOM à travers l'élément personnalisé ion-button.
    link.onClick(0, false, false, false, false);

    expect(router.navigateByUrl).toHaveBeenCalled();
    const urlTree = (router.navigateByUrl as jasmine.Spy).calls.mostRecent().args[0];
    expect(router.serializeUrl(urlTree)).toBe('/tournaments/new');
  });

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

  it('opens the referee code screen for a tournament', () => {
    tournamentServiceSpy.getMine.and.returnValue(of([]));
    const page = createPage();

    page.openRefereeCode(42);

    expect(router.navigate).toHaveBeenCalledWith(['/tournaments', 42, 'referee-code']);
  });

  it('navigates to the tournament management hub when a card is opened', () => {
    tournamentServiceSpy.getMine.and.returnValue(of([]));
    const page = createPage();

    page.openTournament(42);

    expect(router.navigate).toHaveBeenCalledWith(['/tournaments', 42]);
  });
});
