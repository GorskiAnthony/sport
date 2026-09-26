import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StatusBadgeComponent } from './status-badge';

describe('StatusBadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusBadgeComponent] }).compileComponents();
  });

  it('renders the label with the modifier class matching the given color', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('color', 'primary');
    fixture.componentRef.setInput('label', 'En cours');
    fixture.detectChanges();

    const el = fixture.debugElement.query(By.css('.status-badge')).nativeElement as HTMLElement;

    expect(el.textContent?.trim()).toBe('En cours');
    expect(el.classList.contains('status-badge--primary')).toBeTrue();
  });
});
