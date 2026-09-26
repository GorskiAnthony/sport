import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { DashboardStatsService } from '../../../core/services/dashboard-stats.service';
import { OrganizerDashboardStats } from '../../../core/models/dashboard-stats.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { UNLIMITED_PLAN_LIMIT, planUsagePercent } from '../../../shared/utils/plan-usage';
import { MATCH_STATUS_LABELS, TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-home-page',
  standalone: true,
  imports: [PageHeader, RouterLink],
  templateUrl: './dashboard-home.html',
})
export class DashboardHomePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly statsService = inject(DashboardStatsService);

  readonly user = this.authService.currentUser;
  readonly stats = signal<OrganizerDashboardStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly planPercent = computed<number | null>(() => {
    const plan = this.stats()?.plan;
    return plan ? planUsagePercent(plan.usedTournaments, plan.maxTournaments) : null;
  });

  readonly unlimitedTeamsPerTournament = computed(() => {
    const max = this.stats()?.plan.maxTeamsPerTournament;
    return max !== undefined && max >= UNLIMITED_PLAN_LIMIT;
  });

  readonly statusLabels = TOURNAMENT_STATUS_LABELS;
  readonly matchStatusLabels = MATCH_STATUS_LABELS;

  ngOnInit(): void {
    this.statsService.getOrganizerStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
