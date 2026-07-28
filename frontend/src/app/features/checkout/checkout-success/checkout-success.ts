import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Button } from '../../../shared/ui/button/button';

const PLAN_LABELS: Record<string, string> = {
  classic: 'Classic',
  pro: 'Pro',
};

@Component({
  selector: 'app-checkout-success-page',
  standalone: true,
  imports: [Button],
  templateUrl: './checkout-success.html',
})
export class CheckoutSuccessPage {
  private readonly route = inject(ActivatedRoute);

  readonly planLabel = PLAN_LABELS[this.route.snapshot.queryParamMap.get('plan') ?? ''] ?? null;
}
