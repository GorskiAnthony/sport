import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TournamentCardComponent } from './tournament-card';
import { TournamentSummary } from '../../../core/models/tournament.model';

describe('TournamentCardComponent', () => {
  const tournament: TournamentSummary = {
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
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TournamentCardComponent] }).compileComponents();
  });

  function create(): ReturnType<typeof TestBed.createComponent<TournamentCardComponent>> {
    const fixture = TestBed.createComponent(TournamentCardComponent);
    fixture.componentRef.setInput('tournament', tournament);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the tournament name and team count', () => {
    const fixture = create();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h2')?.textContent).toBe('Coupe des vacances');
    expect(el.textContent).toContain('12/16 équipes');
  });

  it('emits open when the card is clicked', () => {
    const fixture = create();
    const emitted = jasmine.createSpy('open');
    fixture.componentInstance.open.subscribe(emitted);

    fixture.debugElement.query(By.css('.tournament-card')).nativeElement.click();

    expect(emitted).toHaveBeenCalled();
  });

  it('emits openRefereeCode without triggering open when the QR button is clicked', () => {
    const fixture = create();
    const openSpy = jasmine.createSpy('open');
    const refereeSpy = jasmine.createSpy('openRefereeCode');
    fixture.componentInstance.open.subscribe(openSpy);
    fixture.componentInstance.openRefereeCode.subscribe(refereeSpy);

    fixture.debugElement.query(By.css('.referee-code-button')).nativeElement.click();

    expect(refereeSpy).toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });
});
