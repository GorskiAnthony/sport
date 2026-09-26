import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TournamentCardSkeletonComponent } from './tournament-card-skeleton';

describe('TournamentCardSkeletonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TournamentCardSkeletonComponent] }).compileComponents();
  });

  it('renders a placeholder shell without content', () => {
    const fixture = TestBed.createComponent(TournamentCardSkeletonComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.tournament-card-skeleton'))).not.toBeNull();
    expect(fixture.debugElement.queryAll(By.css('ion-skeleton-text')).length).toBeGreaterThan(0);
  });
});
