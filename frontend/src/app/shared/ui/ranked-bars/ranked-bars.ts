import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface RankedBarItem {
  label: string;
  value: number;
  color?: string;
}

const DEFAULT_COLOR = '#3987e5';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ranked-bars',
  standalone: true,
  templateUrl: './ranked-bars.html',
})
export class RankedBars {
  readonly items = input.required<RankedBarItem[]>();

  readonly rows = computed(() => {
    const items = this.items();
    const max = Math.max(1, ...items.map((item) => item.value));
    return items.map((item) => ({
      ...item,
      color: item.color ?? DEFAULT_COLOR,
      percent: (item.value / max) * 100,
    }));
  });
}
