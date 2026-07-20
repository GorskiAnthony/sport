import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AdminTournamentSummary } from '../../../core/models/admin.model';
import { TournamentStatus } from '../../../core/models/tournament.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { FormSelect, FormSelectOption } from '../../../shared/ui/form-select/form-select';
import { TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';

const STATUS_OPTIONS: FormSelectOption[] = [
  { value: 'UPCOMING', label: TOURNAMENT_STATUS_LABELS.UPCOMING },
  { value: 'ONGOING', label: TOURNAMENT_STATUS_LABELS.ONGOING },
  { value: 'FINISHED', label: TOURNAMENT_STATUS_LABELS.FINISHED },
];

@Component({
  selector: 'app-admin-tournaments-page',
  standalone: true,
  imports: [PageHeader, StatusBadge, FormSelect],
  templateUrl: './admin-tournaments.html',
})
export class AdminTournamentsPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private searchTimeout?: ReturnType<typeof setTimeout>;

  readonly tournaments = signal<AdminTournamentSummary[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly status = signal('');
  readonly statusOptions = STATUS_OPTIONS;
  readonly skeletons = [1, 2, 3];

  ngOnInit(): void {
    this.load();
  }

  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 300);
  }

  onStatusChange(value: string): void {
    this.status.set(value);
    this.load();
  }

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
  }

  private load(): void {
    this.loading.set(true);
    const status = this.status() ? (this.status() as TournamentStatus) : undefined;
    this.adminService.searchTournaments(this.search(), status).subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
