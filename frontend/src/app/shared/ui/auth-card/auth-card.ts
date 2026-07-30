import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-auth-card',
  standalone: true,
  templateUrl: './auth-card.html',
})
export class AuthCard {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
}
