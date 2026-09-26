import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EmptyStateComponent } from './empty-state';

@Component({
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <app-empty-state icon="alert-circle-outline" tone="danger" title="Oups" message="Impossible de charger.">
      <button type="button">Réessayer</button>
    </app-empty-state>
  `,
})
class HostComponent {}

describe('EmptyStateComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders the title, message and projected action', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const el = fixture.debugElement.query(By.css('.state-container')).nativeElement as HTMLElement;

    expect(el.querySelector('h2')?.textContent).toBe('Oups');
    expect(el.querySelector('p')?.textContent).toBe('Impossible de charger.');
    expect(el.querySelector('button')?.textContent).toBe('Réessayer');
  });

  it('omits the title when none is given', () => {
    @Component({
      standalone: true,
      imports: [EmptyStateComponent],
      template: `<app-empty-state message="Rien à afficher."></app-empty-state>`,
    })
    class NoTitleHostComponent {}

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [NoTitleHostComponent] });
    const fixture = TestBed.createComponent(NoTitleHostComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('h2'))).toBeNull();
  });
});
