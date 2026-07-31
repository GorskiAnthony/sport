import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatchRowComponent } from './match-row';

describe('MatchRowComponent', () => {
  beforeEach(async () => {
    // Le composant anime le score affiché sur plusieurs frames (voir MatchRowComponent.animateTo)
    // — on force chaque requestAnimationFrame à "sauter" directement à la fin de l'animation pour
    // pouvoir vérifier la valeur finale de façon synchrone dans les tests.
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(performance.now() + 10_000);
      return 0;
    });
    await TestBed.configureTestingModule({ imports: [MatchRowComponent] }).compileComponents();
  });

  function create(inputs: Partial<{ homeTeamName: string; awayTeamName: string; homeScore: number | null; awayScore: number | null; status: string; clickable: boolean }>) {
    const fixture = TestBed.createComponent(MatchRowComponent);
    fixture.componentRef.setInput('homeTeamName', inputs.homeTeamName ?? 'Les Aigles');
    fixture.componentRef.setInput('awayTeamName', inputs.awayTeamName ?? 'Les Lions');
    if (inputs.homeScore !== undefined) fixture.componentRef.setInput('homeScore', inputs.homeScore);
    if (inputs.awayScore !== undefined) fixture.componentRef.setInput('awayScore', inputs.awayScore);
    if (inputs.status !== undefined) fixture.componentRef.setInput('status', inputs.status);
    if (inputs.clickable !== undefined) fixture.componentRef.setInput('clickable', inputs.clickable);
    fixture.detectChanges();
    return fixture;
  }

  it('shows "vs" when no score is set yet', () => {
    const fixture = create({});
    const score = fixture.debugElement.query(By.css('.score')).nativeElement as HTMLElement;
    expect(score.textContent?.trim()).toBe('vs');
  });

  it('shows the score once both teams have one', () => {
    const fixture = create({ homeScore: 3, awayScore: 1 });
    const score = fixture.debugElement.query(By.css('.score')).nativeElement as HTMLElement;
    expect(score.textContent?.trim()).toBe('3 – 1');
  });

  it('shows "Forfait" for a forfeited match regardless of score', () => {
    const fixture = create({ homeScore: 0, awayScore: 0, status: 'FORFEIT' });
    const score = fixture.debugElement.query(By.css('.score')).nativeElement as HTMLElement;
    expect(score.textContent?.trim()).toBe('Forfait');
  });

  it('renders a non-interactive div by default', () => {
    const fixture = create({});
    expect(fixture.debugElement.query(By.css('button.match-row'))).toBeNull();
    expect(fixture.debugElement.query(By.css('div.match-row'))).not.toBeNull();
  });

  it('emits rowClick when clickable and tapped', () => {
    const fixture = create({ clickable: true });
    const emitted = jasmine.createSpy('rowClick');
    fixture.componentInstance.rowClick.subscribe(emitted);

    fixture.debugElement.query(By.css('button.match-row')).nativeElement.click();

    expect(emitted).toHaveBeenCalled();
  });
});
