import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatchRowSkeletonComponent } from './match-row-skeleton';

describe('MatchRowSkeletonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MatchRowSkeletonComponent] }).compileComponents();
  });

  it('renders a placeholder shell without content', () => {
    const fixture = TestBed.createComponent(MatchRowSkeletonComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.match-row-skeleton'))).not.toBeNull();
    expect(fixture.debugElement.queryAll(By.css('ion-skeleton-text')).length).toBeGreaterThan(0);
  });
});
