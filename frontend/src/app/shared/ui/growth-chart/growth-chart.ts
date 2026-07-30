import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { GrowthPoint } from '../../../core/models/admin.model';

const WIDTH = 600;
const HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 28, left: 32 };

interface ChartPoint {
  x: number;
  ySignups: number;
  yTournaments: number;
  date: Date;
  signups: number;
  tournaments: number;
}

function lastNDates(n: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}

function toDayKey(date: Date | string): string {
  return typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10);
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-growth-chart',
  standalone: true,
  templateUrl: './growth-chart.html',
})
export class GrowthChart {
  readonly signups = input.required<GrowthPoint[]>();
  readonly tournaments = input.required<GrowthPoint[]>();
  readonly days = input(30);

  readonly hoverIndex = signal<number | null>(null);

  readonly width = WIDTH;
  readonly height = HEIGHT;
  readonly innerWidth = WIDTH - PADDING.left - PADDING.right;
  readonly innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  readonly padding = PADDING;

  private readonly maxValue = computed(() => {
    const max = Math.max(1, ...this.points().flatMap((p) => [p.signups, p.tournaments]));
    return Math.ceil(max * 1.15);
  });

  readonly points = computed<ChartPoint[]>(() => {
    const dates = lastNDates(this.days());
    const signupsByDay = new Map(this.signups().map((p) => [toDayKey(p.date), p.count]));
    const tournamentsByDay = new Map(this.tournaments().map((p) => [toDayKey(p.date), p.count]));
    const n = dates.length;

    return dates.map((date, i) => {
      const key = toDayKey(date);
      const signupsCount = signupsByDay.get(key) ?? 0;
      const tournamentsCount = tournamentsByDay.get(key) ?? 0;
      const x = PADDING.left + (n === 1 ? 0 : (i / (n - 1)) * this.innerWidth);
      return {
        x,
        ySignups: 0,
        yTournaments: 0,
        date,
        signups: signupsCount,
        tournaments: tournamentsCount,
      };
    });
  });

  private readonly scaledPoints = computed(() => {
    const max = this.maxValue();
    return this.points().map((p) => ({
      ...p,
      ySignups: PADDING.top + this.innerHeight - (p.signups / max) * this.innerHeight,
      yTournaments: PADDING.top + this.innerHeight - (p.tournaments / max) * this.innerHeight,
    }));
  });

  readonly signupsPath = computed(() => this.buildPath(this.scaledPoints().map((p) => [p.x, p.ySignups])));
  readonly tournamentsPath = computed(() => this.buildPath(this.scaledPoints().map((p) => [p.x, p.yTournaments])));

  readonly yTicks = computed(() => {
    const max = this.maxValue();
    return [0, 0.5, 1].map((f) => ({
      y: PADDING.top + this.innerHeight - f * this.innerHeight,
      label: Math.round(max * f),
    }));
  });

  readonly xTicks = computed(() => {
    const pts = this.scaledPoints();
    const n = pts.length;
    const indices = [0, Math.floor((n - 1) / 2), n - 1];
    return indices.map((i) => ({ x: pts[i].x, label: this.formatShortDate(pts[i].date) }));
  });

  readonly hovered = computed(() => {
    const i = this.hoverIndex();
    return i === null ? null : this.scaledPoints()[i];
  });

  onMouseMove(event: MouseEvent): void {
    const svgEl = event.currentTarget as SVGSVGElement;
    const rect = svgEl.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const n = this.scaledPoints().length;
    const ratio = (relativeX - PADDING.left) / this.innerWidth;
    const index = Math.round(ratio * (n - 1));
    this.hoverIndex.set(Math.min(n - 1, Math.max(0, index)));
  }

  onMouseLeave(): void {
    this.hoverIndex.set(null);
  }

  formatShortDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  private buildPath(coords: [number, number][]): string {
    return coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  }
}
