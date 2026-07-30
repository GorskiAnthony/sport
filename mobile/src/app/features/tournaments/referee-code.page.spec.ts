import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TournamentService } from '../../core/services/tournament.service';
import { RefereeCodePage } from './referee-code.page';
import { RefereeJoinInfo } from '../../core/models/tournament.model';

describe('RefereeCodePage', () => {
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;

  const joinInfo: RefereeJoinInfo = { token: 'abc123', joinUrl: 'http://localhost:8100/join/abc123' };

  beforeEach(async () => {
    tournamentServiceSpy = jasmine.createSpyObj('TournamentService', ['getRefereeJoinInfo', 'regenerateRefereeJoinToken']);

    await TestBed.configureTestingModule({
      imports: [RefereeCodePage],
      providers: [
        { provide: TournamentService, useValue: tournamentServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '10' }) } },
        },
      ],
    }).compileComponents();
  });

  function createPage(): RefereeCodePage {
    const fixture = TestBed.createComponent(RefereeCodePage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    return page;
  }

  it('loads the join info for the tournament id from the route and renders a QR code', async () => {
    tournamentServiceSpy.getRefereeJoinInfo.and.returnValue(of(joinInfo));

    const page = createPage();
    // toDataURL() est async (Promise) — laisse le microtask se résoudre.
    await Promise.resolve();

    expect(tournamentServiceSpy.getRefereeJoinInfo).toHaveBeenCalledWith(10);
    expect(page.loading()).toBeFalse();
    expect(page.qrDataUrl()).toMatch(/^data:image\//);
  });

  it('surfaces an error state when the request fails', () => {
    tournamentServiceSpy.getRefereeJoinInfo.and.returnValue(throwError(() => new Error('down')));

    const page = createPage();

    expect(page.error()).toBeTrue();
    expect(page.loading()).toBeFalse();
  });

  it('regenerates the token and re-renders the QR code', async () => {
    tournamentServiceSpy.getRefereeJoinInfo.and.returnValue(of(joinInfo));
    const page = createPage();
    await Promise.resolve();

    tournamentServiceSpy.regenerateRefereeJoinToken.and.returnValue(
      of({ token: 'new-token', joinUrl: 'http://localhost:8100/join/new-token' }),
    );
    page.regenerate();
    await Promise.resolve();

    expect(tournamentServiceSpy.regenerateRefereeJoinToken).toHaveBeenCalledWith(10);
    expect(page.regenerating()).toBeFalse();
  });
});
