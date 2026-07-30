import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface FormSelectOption {
  value: string;
  label: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-select',
  standalone: true,
  templateUrl: './form-select.html',
})
export class FormSelect {
  readonly id = input.required<string>();
  readonly label = input<string>('');
  readonly options = input.required<FormSelectOption[]>();
  readonly placeholder = input<string>('Choisir…');
  readonly value = model<string>('');
  readonly required = input(false);
  readonly error = input<string | undefined>(undefined);

  onChange(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
