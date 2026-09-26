import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TournamentSessionService, TournamentJoinResponse } from '../../core/auth/tournament-session.service';
import { JoinPage } from './join.page';

describe('JoinPage', () => {
  let tournamentSessionServiceSpy: jasmine.SpyObj<TournamentSessionService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const joinResponse: TournamentJoinResponse = {
    sessionToken: 'session-jwt',
    tournamentId: 10,
    tournamentName: 'Coupe des vacances',
  };

  beforeEach(async () => {
    tournamentSessionServiceSpy = jasmine.createSpyObj('TournamentSessionService', ['join']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [JoinPage],
      providers: [
        { provide: TournamentSessionService, useValue: tournamentSessionServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ token: 'qr-token' }) } },
        },
      ],
    }).compileComponents();
  });

  function createPage(): JoinPage {
    const fixture = TestBed.createComponent(JoinPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('joins anonymously (no name typed) and navigates to the tournament live view', () => {
    tournamentSessionServiceSpy.join.and.returnValue(of(joinResponse));
    const page = createPage();

    page.join();

    expect(tournamentSessionServiceSpy.join).toHaveBeenCalledWith('qr-token', undefined);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tournaments', 10, 'live']);
    expect(page.loading()).toBeFalse();
  });

  it('joins with a name when one is typed', () => {
    tournamentSessionServiceSpy.join.and.returnValue(of(joinResponse));
    const page = createPage();
    page.onNameInput('  Jean  ');

    page.join();

    expect(tournamentSessionServiceSpy.join).toHaveBeenCalledWith('qr-token', 'Jean');
  });

  it('surfaces an error when the token is invalid', () => {
    tournamentSessionServiceSpy.join.and.returnValue(throwError(() => new Error('not found')));
    const page = createPage();

    page.join();

    expect(page.error()).toBeTrue();
    expect(page.loading()).toBeFalse();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
