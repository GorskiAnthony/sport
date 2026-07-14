import { Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  templateUrl: './auth-card.html',
})
export class AuthCard {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
}
