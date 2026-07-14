import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ButtonVariant = 'primary' | 'outline' | 'ghost';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './button.html',
})
export class Button {
  readonly text = input.required<string>();
  readonly variant = input<ButtonVariant>('outline');
  readonly href = input<string | undefined>(undefined);
  readonly routerLink = input<string | undefined>(undefined);
  readonly type = input<'button' | 'submit'>('button');
  readonly className = input<string>('');
  readonly arrow = input(false);
  readonly disabled = input(false);

  readonly clicked = output<void>();

  private static readonly VARIANTS: Record<ButtonVariant, string> = {
    primary: 'bg-green-500 hover:bg-green-600 text-black focus-visible:outline-green-500',
    outline:
      'border border-slate-400 text-slate-300 hover:text-white hover:bg-[#161B22] focus-visible:outline-slate-400',
    ghost: 'text-slate-300 hover:text-white hover:bg-[#161B22] focus-visible:outline-slate-400',
  };

  readonly classes = computed(() => {
    const base =
      'inline-flex items-center gap-2 px-5 py-2.5 rounded font-medium text-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 disabled:opacity-50 disabled:cursor-not-allowed';
    return `${base} ${Button.VARIANTS[this.variant()]} ${this.className()}`;
  });
}
