import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router, convertToParamMap } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { of, throwError } from 'rxjs';
import { TournamentService } from '../../core/services/tournament.service';
import { TeamService } from '../../core/services/team.service';
import { BracketService } from '../../core/services/bracket.service';
import { TournamentDetailPage } from './tournament-detail.page';
import { TournamentDetail } from '../../core/models/tournament.model';
import { Match } from '../../core/models/match.model';
import { Team } from '../../core/models/team.model';

describe('TournamentDetailPage', () => {
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;
  let teamServiceSpy: jasmine.SpyObj<TeamService>;
  let bracketServiceSpy: jasmine.SpyObj<BracketService>;
  let router: Router;
  let alertControllerSpy: jasmine.SpyObj<AlertController>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;

  function team(id: number, name: string): Team {
    return { id, name, club: null, logo: null, category: 'U15', contact: null, tournamentId: 1, createdAt: '', updatedAt: '' };
  }

  function match(id: number, phase: string, home: Team, away: Team, opts: Partial<Match> = {}): Match {
    return {
      id,
      tournamentId: 1,
      tournamentName: 'Coupe',
      homeTeam: home,
      awayTeam: away,
      homeScore: null,
      awayScore: null,
      homeFairPlay: null,
      awayFairPlay: null,
      forfeitedTeamId: null,
      phase,
      date: `2026-08-01T${10 + id}:00:00Z`,
      venue: null,
      status: 'SCHEDULED',
      ...opts,
    };
  }

  const teamA = team(1, 'Équipe A');
  const teamB = team(2, 'Équipe B');
  const teamC = team(3, 'Équipe C');
  const teamD = team(4, 'Équipe D');

  function buildDetail(overrides: Partial<TournamentDetail> = {}): TournamentDetail {
    return {
      id: 1,
      name: 'Coupe des vacances',
      sport: 'football',
      category: 'u15',
      location: null,
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      status: 'ONGOING',
      maxTeams: 16,
      format: null,
      description: null,
      terrains: null,
      teams: [teamA, teamB, teamC, teamD],
      matches: [],
      ...overrides,
    };
  }

  beforeEach(async () => {
    tournamentServiceSpy = jasmine.createSpyObj('TournamentService', ['getById', 'delete']);
    teamServiceSpy = jasmine.createSpyObj('TeamService', ['create', 'update', 'delete']);
    bracketServiceSpy = jasmine.createSpyObj('BracketService', ['generate', 'advance']);
    alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
    const alertSpy = jasmine.createSpyObj('HTMLIonAlertElement', ['present']);
    alertControllerSpy.create.and.resolveTo(alertSpy);
    toastControllerSpy = jasmine.createSpyObj('ToastController', ['create']);
    toastControllerSpy.create.and.resolveTo(jasmine.createSpyObj('HTMLIonToastElement', ['present']));

    await TestBed.configureTestingModule({
      imports: [TournamentDetailPage],
      providers: [
        { provide: TournamentService, useValue: tournamentServiceSpy },
        { provide: TeamService, useValue: teamServiceSpy },
        { provide: BracketService, useValue: bracketServiceSpy },
        { provide: AlertController, useValue: alertControllerSpy },
        { provide: ToastController, useValue: toastControllerSpy },
        // ion-back-button (NavController) et routerLink ont tous les deux besoin d'un vrai
        // Router — voir tournament-list.page.spec.ts / login.page.spec.ts pour la même raison.
        // Doit précéder le provider ActivatedRoute ci-dessous : provideRouter() enregistre son
        // propre ActivatedRoute racine, et le dernier provider du même jeton gagne — le nôtre
        // doit donc venir après pour ne pas être écrasé.
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  function createPage(): TournamentDetailPage {
    const fixture = TestBed.createComponent(TournamentDetailPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    return page;
  }

  it('loads the tournament detail', () => {
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail()));

    const page = createPage();

    expect(tournamentServiceSpy.getById).toHaveBeenCalledWith(1);
    expect(page.tournament()?.name).toBe('Coupe des vacances');
    expect(page.loading()).toBeFalse();
  });

  it('surfaces a not-found state on error', () => {
    tournamentServiceSpy.getById.and.returnValue(throwError(() => new Error('404')));

    const page = createPage();

    expect(page.notFound()).toBeTrue();
  });

  it('splits group-phase matches from knockout matches', () => {
    const poolMatch = match(1, 'Groupe A', teamA, teamB, { homeScore: 2, awayScore: 1, status: 'FINISHED' });
    const knockoutMatch = match(2, 'Demi-finale', teamC, teamD);
    tournamentServiceSpy.getById.and.returnValue(
      of(buildDetail({ format: 'GROUP_KNOCKOUT', matches: [poolMatch, knockoutMatch] })),
    );

    const page = createPage();

    expect(page.knockoutMatches()).toEqual([knockoutMatch]);
    expect(page.groupPhases()).toEqual([{ label: 'Groupe A', teams: [teamA, teamB], matches: [poolMatch] }]);
  });

  it('computes round-robin standings from all matches', () => {
    const m = match(1, 'Poule unique', teamA, teamB, { homeScore: 3, awayScore: 1, status: 'FINISHED' });
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail({ format: 'ROUND_ROBIN', matches: [m] })));

    const page = createPage();

    const standings = page.standings();
    expect(standings.find((s) => s.name === 'Équipe A')?.pts).toBe(3);
    expect(standings.find((s) => s.name === 'Équipe B')?.pts).toBe(0);
  });

  it('generates the bracket with the chosen format and groupCount', () => {
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail()));
    bracketServiceSpy.generate.and.returnValue(of([]));
    const page = createPage();
    page.chosenFormat.set('GROUP_KNOCKOUT');
    page.onGroupCountInput('2');

    page.generateBracket();

    expect(bracketServiceSpy.generate).toHaveBeenCalledWith(1, 'GROUP_KNOCKOUT', 2);
    expect(tournamentServiceSpy.getById).toHaveBeenCalledTimes(2);
    expect(page.generating()).toBeFalse();
  });

  it('does nothing when generating without a chosen format', () => {
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail()));
    const page = createPage();

    page.generateBracket();

    expect(bracketServiceSpy.generate).not.toHaveBeenCalled();
  });

  it('advances a round and reports the champion when the tournament completes', async () => {
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail({ format: 'SINGLE_ELIMINATION' })));
    bracketServiceSpy.advance.and.returnValue(of({ matches: [], tournamentComplete: true, champion: teamA }));
    const page = createPage();

    page.advanceRound();
    await Promise.resolve();

    expect(toastControllerSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: jasmine.stringMatching(/Champion.*Équipe A/) }),
    );
    expect(page.advancing()).toBeFalse();
  });

  it('shows an error toast when advancing fails', async () => {
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail({ format: 'SINGLE_ELIMINATION' })));
    bracketServiceSpy.advance.and.returnValue(throwError(() => new Error('boom')));
    const page = createPage();

    page.advanceRound();
    await Promise.resolve();

    expect(page.advancing()).toBeFalse();
    expect(toastControllerSpy.create).toHaveBeenCalled();
  });

  it('deletes the tournament and navigates back to the list', () => {
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail()));
    tournamentServiceSpy.delete.and.returnValue(of({ success: true }));
    const page = createPage();

    (page as unknown as { deleteTournament(): void }).deleteTournament();

    expect(tournamentServiceSpy.delete).toHaveBeenCalledWith(1);
    expect(router.navigate).toHaveBeenCalledWith(['/tournaments']);
  });

  it('adds a team inline and reloads the tournament', () => {
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail()));
    teamServiceSpy.create.and.returnValue(of(team(5, 'Équipe E')));
    const page = createPage();
    page.startAddTeam();
    page.onTeamNameInput('Équipe E');

    page.saveTeam();

    expect(teamServiceSpy.create).toHaveBeenCalledWith({ name: 'Équipe E', category: 'U15', tournamentId: 1 });
    expect(page.addingTeam()).toBeFalse();
    expect(tournamentServiceSpy.getById).toHaveBeenCalledTimes(2);
  });

  it('rejects saving a team with an empty name', () => {
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail()));
    const page = createPage();
    page.startAddTeam();

    page.saveTeam();

    expect(teamServiceSpy.create).not.toHaveBeenCalled();
    expect(page.teamError()).toBeTruthy();
  });

  it('edits an existing team inline', () => {
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail()));
    teamServiceSpy.update.and.returnValue(of({ ...teamA, name: 'Équipe A2' }));
    const page = createPage();
    page.startEditTeam(teamA);
    page.onTeamNameInput('Équipe A2');

    page.saveTeam();

    expect(teamServiceSpy.update).toHaveBeenCalledWith(1, { name: 'Équipe A2', category: 'U15' });
    expect(page.editingTeamId()).toBeNull();
  });

  it('deletes a team via the confirm alert handler', () => {
    tournamentServiceSpy.getById.and.returnValue(of(buildDetail()));
    teamServiceSpy.delete.and.returnValue(of({ success: true }));
    const page = createPage();

    (page as unknown as { deleteTeam(id: number): void }).deleteTeam(1);

    expect(teamServiceSpy.delete).toHaveBeenCalledWith(1);
    expect(tournamentServiceSpy.getById).toHaveBeenCalledTimes(2);
  });
});
