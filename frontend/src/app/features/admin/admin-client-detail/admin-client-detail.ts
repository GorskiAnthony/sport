import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUserDetail } from '../../../core/models/admin.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';

@Component({
  selector: 'app-admin-client-detail-page',
  standalone: true,
  imports: [RouterLink, PageHeader, StatusBadge, DatePipe],
  templateUrl: './admin-client-detail.html',
})
export class AdminClientDetailPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly userId = Number(this.route.snapshot.paramMap.get('id'));

  readonly client = signal<AdminUserDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly statusLabels = TOURNAMENT_STATUS_LABELS;

  ngOnInit(): void {
    this.adminService.getUser(this.userId).subscribe({
      next: (client) => {
        this.client.set(client);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
  }
}
