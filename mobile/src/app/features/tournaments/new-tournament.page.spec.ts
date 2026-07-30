import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { of, throwError, EMPTY } from 'rxjs';
import { TournamentService } from '../../core/services/tournament.service';
import { TeamService } from '../../core/services/team.service';
import { BracketService } from '../../core/services/bracket.service';
import { AuthService } from '../../core/auth/auth.service';
import { NewTournamentPage } from './new-tournament.page';
import { TournamentSummary } from '../../core/models/tournament.model';
import { Team } from '../../core/models/team.model';
import { User } from '../../core/models/user.model';

describe('NewTournamentPage', () => {
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;
  let teamServiceSpy: jasmine.SpyObj<TeamService>;
  let bracketServiceSpy: jasmine.SpyObj<BracketService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;
  let toastSpy: jasmine.SpyObj<HTMLIonToastElement>;

  const organizer: User = { id: 1, name: 'Alice', email: 'alice@example.com', role: 'ORGANIZER', plan: 'CLASSIC' };

  const createdTournament: TournamentSummary = {
    id: 42,
    name: 'Coupe des vacances',
    sport: 'football',
    category: 'u15',
    location: null,
    startDate: '2026-08-01',
    endDate: '2026-08-02',
    status: 'UPCOMING',
    maxTeams: 14,
    teamsCount: 0,
    format: null,
  };

  const team: Team = {
    id: 1,
    name: 'Les Aigles',
    club: null,
    logo: null,
    category: 'U15',
    contact: null,
    tournamentId: 42,
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(async () => {
    tournamentServiceSpy = jasmine.createSpyObj('TournamentService', ['getMine', 'create']);
    teamServiceSpy = jasmine.createSpyObj('TeamService', ['create']);
    bracketServiceSpy = jasmine.createSpyObj('BracketService', ['generate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', [], { currentUser: () => organizer });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    toastSpy = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastControllerSpy = jasmine.createSpyObj('ToastController', ['create']);
    toastControllerSpy.create.and.resolveTo(toastSpy);
    const alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
    alertControllerSpy.create.and.resolveTo(jasmine.createSpyObj('HTMLIonAlertElement', ['present']));

    tournamentServiceSpy.getMine.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [NewTournamentPage],
      providers: [
        { provide: TournamentService, useValue: tournamentServiceSpy },
        { provide: TeamService, useValue: teamServiceSpy },
        { provide: BracketService, useValue: bracketServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastController, useValue: toastControllerSpy },
        { provide: AlertController, useValue: alertControllerSpy },
      ],
    }).compileComponents();
  });

  function createPage(): NewTournamentPage {
    const fixture = TestBed.createComponent(NewTournamentPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    return page;
  }

  it('blocks creation when the organizer is already at their plan limit', () => {
    tournamentServiceSpy.getMine.and.returnValue(of([createdTournament]));
    Object.defineProperty(authServiceSpy, 'currentUser', { value: () => ({ ...organizer, plan: 'FREE' }) });

    const page = createPage();

    expect(page.planBlocked()).toBeTrue();
  });

  it('does not block creation for a CLASSIC organizer with an existing tournament', () => {
    tournamentServiceSpy.getMine.and.returnValue(of([createdTournament]));

    const page = createPage();

    expect(page.planBlocked()).toBeFalse();
  });

  it('rejects step 1 submission with missing required fields', () => {
    const page = createPage();

    page.submitStepOne();

    expect(tournamentServiceSpy.create).not.toHaveBeenCalled();
    expect(page.errors().name).toBeTruthy();
    expect(page.errors().sport).toBeTruthy();
    expect(page.errors().format).toBeTruthy();
  });

  it('advances to step 2 and stores the created tournament id on success', () => {
    tournamentServiceSpy.create.and.returnValue(of(createdTournament));
    const page = createPage();
    page.onNameInput('Coupe des vacances');
    page.onSportChange('football');
    page.onCategoryChange('u15');
    page.format.set('ROUND_ROBIN');
    page.onEndDateInput('2026-08-02');

    page.submitStepOne();

    expect(page.createdTournamentId()).toBe(42);
    expect(page.step()).toBe(2);
    expect(page.loading()).toBeFalse();
  });

  it('shows the plan-limit toast on a 403 response instead of the generic error', async () => {
    tournamentServiceSpy.create.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'Limite atteinte' } })),
    );
    const page = createPage();
    page.onNameInput('Coupe des vacances');
    page.onSportChange('football');
    page.onCategoryChange('u15');
    page.format.set('ROUND_ROBIN');
    page.onEndDateInput('2026-08-02');

    page.submitStepOne();
    await Promise.resolve();

    expect(page.loading()).toBeFalse();
    expect(page.step()).toBe(1);
    expect(toastControllerSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: jasmine.stringMatching(/plan supérieur/) }),
    );
  });

  it('adds, edits and removes team rows', () => {
    const page = createPage();

    page.addTeamRow();
    page.addTeamRow();
    page.updateTeamRowName(0, 'Les Aigles');
    page.updateTeamRowCategory(0, 'U18');

    expect(page.teams()).toEqual([
      { name: 'Les Aigles', category: 'U18' },
      { name: '', category: 'U15' },
    ]);

    page.removeTeamRow(1);

    expect(page.teams().length).toBe(1);
  });

  it('finish() with no named team rows navigates away without creating teams or a bracket', () => {
    const page = createPage();
    page.createdTournamentId.set(42);
    page.format.set('ROUND_ROBIN');
    page.addTeamRow();

    page.finish();

    expect(teamServiceSpy.create).not.toHaveBeenCalled();
    expect(bracketServiceSpy.generate).not.toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tournaments']);
  });

  it('finish() blocks GROUP_KNOCKOUT with too few teams per group and stays on step 2', () => {
    const page = createPage();
    page.createdTournamentId.set(42);
    page.format.set('GROUP_KNOCKOUT');
    page.onGroupCountInput('4');
    for (let i = 0; i < 5; i++) {
      page.addTeamRow();
      page.updateTeamRowName(i, `Équipe ${i}`);
    }

    page.finish();

    expect(teamServiceSpy.create).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('finish() creates every named team then generates the bracket with the chosen groupCount', () => {
    teamServiceSpy.create.and.returnValue(of(team));
    bracketServiceSpy.generate.and.returnValue(of([]));
    const page = createPage();
    page.createdTournamentId.set(42);
    page.format.set('GROUP_KNOCKOUT');
    page.onGroupCountInput('2');
    for (let i = 0; i < 6; i++) {
      page.addTeamRow();
      page.updateTeamRowName(i, `Équipe ${i}`);
    }

    page.finish();

    expect(teamServiceSpy.create).toHaveBeenCalledTimes(6);
    expect(bracketServiceSpy.generate).toHaveBeenCalledWith(42, 'GROUP_KNOCKOUT', 2);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tournaments']);
    expect(page.finishing()).toBeFalse();
  });

  it('finish() generates the bracket without a groupCount for non-GROUP_KNOCKOUT formats', () => {
    teamServiceSpy.create.and.returnValue(of(team));
    bracketServiceSpy.generate.and.returnValue(of([]));
    const page = createPage();
    page.createdTournamentId.set(42);
    page.format.set('SINGLE_ELIMINATION');
    page.addTeamRow();
    page.updateTeamRowName(0, 'Équipe A');
    page.addTeamRow();
    page.updateTeamRowName(1, 'Équipe B');

    page.finish();

    expect(bracketServiceSpy.generate).toHaveBeenCalledWith(42, 'SINGLE_ELIMINATION', undefined);
  });

  it('finish() keeps the organizer on step 2 when team creation fails', () => {
    teamServiceSpy.create.and.returnValue(throwError(() => new Error('boom')));
    const page = createPage();
    page.createdTournamentId.set(42);
    page.format.set('SINGLE_ELIMINATION');
    page.addTeamRow();
    page.updateTeamRowName(0, 'Équipe A');
    page.addTeamRow();
    page.updateTeamRowName(1, 'Équipe B');

    page.finish();

    expect(bracketServiceSpy.generate).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(page.finishing()).toBeFalse();
  });
});
