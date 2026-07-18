import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  readonly status = input.required<string>();
  readonly label = input.required<string>();

  readonly isLive = computed(() => this.status() === 'ONGOING');

  readonly classes = computed(() => {
    switch (this.status()) {
      case 'ONGOING':
        return 'bg-green-500/20 text-green-400';
      case 'FINISHED':
        return 'bg-slate-500/20 text-slate-300';
      default:
        return 'bg-amber-500/20 text-amber-400';
    }
  });
}
