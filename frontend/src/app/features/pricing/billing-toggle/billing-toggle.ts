import { Component, model } from '@angular/core';

export type BillingPeriod = 'monthly' | 'annual';

@Component({
  selector: 'app-billing-toggle',
  standalone: true,
  templateUrl: './billing-toggle.html',
})
export class BillingToggle {
  readonly period = model<BillingPeriod>('monthly');

  select(period: BillingPeriod): void {
    this.period.set(period);
  }
}
