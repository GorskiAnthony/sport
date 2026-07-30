import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '../../../shared/ui/button/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-checkout-cancel-page',
  standalone: true,
  imports: [Button],
  templateUrl: './checkout-cancel.html',
})
export class CheckoutCancelPage {}
