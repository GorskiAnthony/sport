import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AdminOverview } from '../../../core/models/admin.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { GrowthChart } from '../../../shared/ui/growth-chart/growth-chart';
import { RankedBars, RankedBarItem } from '../../../shared/ui/ranked-bars/ranked-bars';
import { MATCH_STATUS_LABELS, TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';

const PLAN_COLORS: Record<string, string> = {
  FREE: '#86b6ef',
  CLASSIC: '#3987e5',
  PRO: '#184f95',
};

@Component({
  selector: 'app-admin-overview-page',
  standalone: true,
  imports: [PageHeader, GrowthChart, RankedBars],
  templateUrl: './admin-overview.html',
})
export class AdminOverviewPage implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly overview = signal<AdminOverview | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly statusLabels = TOURNAMENT_STATUS_LABELS;
  readonly matchStatusLabels = MATCH_STATUS_LABELS;

  readonly planBars = computed<RankedBarItem[]>(() => {
    const breakdown = this.overview()?.planBreakdown ?? [];
    return breakdown.map((p) => ({ label: p.plan, value: p.count, color: PLAN_COLORS[p.plan] }));
  });

  ngOnInit(): void {
    this.adminService.getOverview().subscribe({
      next: (overview) => {
        this.overview.set(overview);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
