import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router, convertToParamMap } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TournamentService } from '../../core/services/tournament.service';
import { EditTournamentPage } from './edit-tournament.page';
import { TournamentDetail, TournamentSummary } from '../../core/models/tournament.model';

describe('EditTournamentPage', () => {
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;
  let router: Router;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;

  const detail: TournamentDetail = {
    id: 10,
    name: 'Coupe des vacances',
    sport: 'football',
    category: 'u15',
    location: 'Marseille',
    startDate: '2026-08-01',
    endDate: '2026-08-02',
    status: 'UPCOMING',
    maxTeams: 16,
    format: null,
    description: 'Un beau tournoi',
    terrains: 'Terrain 1',
    teams: [],
    matches: [],
  };

  beforeEach(async () => {
    tournamentServiceSpy = jasmine.createSpyObj('TournamentService', ['getById', 'update']);
    const toastSpy = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastControllerSpy = jasmine.createSpyObj('ToastController', ['create']);
    toastControllerSpy.create.and.resolveTo(toastSpy);

    await TestBed.configureTestingModule({
      imports: [EditTournamentPage],
      providers: [
        { provide: TournamentService, useValue: tournamentServiceSpy },
        { provide: ToastController, useValue: toastControllerSpy },
        // ion-back-button (NavController) a besoin d'un vrai Router — voir
        // tournament-list.page.spec.ts pour la même raison. Doit précéder le provider
        // ActivatedRoute : provideRouter() enregistre son propre ActivatedRoute racine, et le
        // dernier provider du même jeton gagne.
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '10' }) } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  function createPage(): EditTournamentPage {
    const fixture = TestBed.createComponent(EditTournamentPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    return page;
  }

  it('pre-fills the form from the loaded tournament', () => {
    tournamentServiceSpy.getById.and.returnValue(of(detail));

    const page = createPage();

    expect(tournamentServiceSpy.getById).toHaveBeenCalledWith(10);
    expect(page.name()).toBe('Coupe des vacances');
    expect(page.location()).toBe('Marseille');
    expect(page.terrains()).toBe('Terrain 1');
    expect(page.loading()).toBeFalse();
  });

  it('surfaces a not-found state when the tournament cannot be loaded', () => {
    tournamentServiceSpy.getById.and.returnValue(throwError(() => new Error('404')));

    const page = createPage();

    expect(page.notFound()).toBeTrue();
    expect(page.loading()).toBeFalse();
  });

  it('rejects submission with missing required fields', () => {
    tournamentServiceSpy.getById.and.returnValue(of(detail));
    const page = createPage();
    page.onNameInput('');

    page.submit();

    expect(tournamentServiceSpy.update).not.toHaveBeenCalled();
    expect(page.errors().name).toBeTruthy();
  });

  it('updates the tournament and navigates back to the hub on success', () => {
    tournamentServiceSpy.getById.and.returnValue(of(detail));
    const updated: TournamentSummary = { ...detail, location: 'Lyon', teamsCount: 0 };
    tournamentServiceSpy.update.and.returnValue(of(updated));
    const page = createPage();
    page.onLocationInput('Lyon');

    page.submit();

    expect(tournamentServiceSpy.update).toHaveBeenCalledWith(10, jasmine.objectContaining({ location: 'Lyon' }));
    expect(router.navigate).toHaveBeenCalledWith(['/tournaments', 10]);
    expect(page.saving()).toBeFalse();
  });

  it('shows an error toast and stays on the page when the update fails', async () => {
    tournamentServiceSpy.getById.and.returnValue(of(detail));
    tournamentServiceSpy.update.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Erreur serveur' } })),
    );
    const page = createPage();

    page.submit();
    await Promise.resolve();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(page.saving()).toBeFalse();
    expect(toastControllerSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({ message: 'Erreur serveur' }));
  });
});
