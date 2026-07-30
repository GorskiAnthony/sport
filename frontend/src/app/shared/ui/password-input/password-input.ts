import { ChangeDetectionStrategy, Component, input, model, signal } from '@angular/core';
import { FormInput } from '../form-input/form-input';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-password-input',
  standalone: true,
  imports: [FormInput],
  templateUrl: './password-input.html',
})
export class PasswordInput {
  readonly id = input.required<string>();
  readonly label = input<string>('');
  readonly value = model<string>('');
  readonly autoComplete = input<string>('off');
  readonly required = input(false);
  readonly error = input<string | undefined>(undefined);

  readonly visible = signal(false);

  toggle(): void {
    this.visible.update((v) => !v);
  }
}
