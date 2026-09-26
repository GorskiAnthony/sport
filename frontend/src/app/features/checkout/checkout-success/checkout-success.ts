import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Button } from '../../../shared/ui/button/button';

const PLAN_LABELS: Record<string, string> = {
  classic: 'Classic',
  pro: 'Pro',
};

const MAX_SYNC_ATTEMPTS = 4;
const SYNC_RETRY_DELAY_MS = 1500;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-checkout-success-page',
  standalone: true,
  imports: [Button],
  templateUrl: './checkout-success.html',
})
export class CheckoutSuccessPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly planLabel = PLAN_LABELS[this.route.snapshot.queryParamMap.get('plan') ?? ''] ?? null;

  ngOnInit(): void {
    // Le checkout hébergé Stripe redirige ici dès le paiement confirmé, mais le webhook qui
    // applique le nouveau plan côté serveur peut arriver quelques instants après : on retente
    // un court instant tant que le plan local ne correspond pas encore au plan acheté.
    const expectedPlan = this.route.snapshot.queryParamMap.get('plan')?.toUpperCase() ?? null;
    this.syncPlan(expectedPlan, 0);
  }

  private syncPlan(expectedPlan: string | null, attempt: number): void {
    this.authService.refreshUser().subscribe({
      next: (user) => {
        if (expectedPlan && user.plan !== expectedPlan && attempt < MAX_SYNC_ATTEMPTS) {
          setTimeout(() => this.syncPlan(expectedPlan, attempt + 1), SYNC_RETRY_DELAY_MS);
        }
      },
      error: () => {},
    });
  }
}
