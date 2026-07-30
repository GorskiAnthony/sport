import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-input',
  standalone: true,
  templateUrl: './form-input.html',
})
export class FormInput {
  readonly id = input.required<string>();
  readonly label = input<string>('');
  readonly type = input<string>('text');
  readonly placeholder = input<string>('');
  readonly value = model<string>('');
  readonly autoComplete = input<string>('off');
  readonly required = input(false);
  readonly error = input<string | undefined>(undefined);

  onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
