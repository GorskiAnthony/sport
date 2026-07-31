import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { BreadcrumbComponent } from './breadcrumb';

describe('BreadcrumbComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders earlier segments as links and the last one as plain text', () => {
    const fixture = TestBed.createComponent(BreadcrumbComponent);
    fixture.componentRef.setInput('segments', [
      { label: 'Tournois', route: ['/tournaments'] },
      { label: 'U9 Test Rotation' },
    ]);
    fixture.detectChanges();

    const links = fixture.debugElement.queryAll(By.css('a.crumb-link'));
    const current = fixture.debugElement.query(By.css('.crumb-current'));

    expect(links.length).toBe(1);
    expect(links[0].nativeElement.textContent.trim()).toBe('Tournois');
    expect(current.nativeElement.textContent.trim()).toBe('U9 Test Rotation');
  });

  it('renders a single segment as plain text with no link', () => {
    const fixture = TestBed.createComponent(BreadcrumbComponent);
    fixture.componentRef.setInput('segments', [{ label: 'Match' }]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('a.crumb-link'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.crumb-current')).nativeElement.textContent.trim()).toBe('Match');
  });
});
