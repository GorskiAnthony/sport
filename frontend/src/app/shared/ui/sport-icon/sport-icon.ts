import { Component, computed, input } from '@angular/core';
import { SPORT_ICONS } from '../../utils/labels';

export type SportIconSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<SportIconSize, string> = {
  sm: 'w-9 h-9 text-lg rounded-lg',
  md: 'w-12 h-12 text-2xl rounded-xl',
  lg: 'w-16 h-16 text-3xl rounded-2xl',
};

@Component({
  selector: 'app-sport-icon',
  standalone: true,
  templateUrl: './sport-icon.html',
})
export class SportIcon {
  readonly sport = input.required<string>();
  readonly size = input<SportIconSize>('md');

  readonly icon = computed(() => SPORT_ICONS[this.sport()] ?? '🏆');
  readonly sizeClasses = computed(() => SIZE_CLASSES[this.size()]);
}
