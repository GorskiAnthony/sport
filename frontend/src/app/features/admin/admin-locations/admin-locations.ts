import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AdminLocationStats } from '../../../core/models/admin.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { RankedBars, RankedBarItem } from '../../../shared/ui/ranked-bars/ranked-bars';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-locations-page',
  standalone: true,
  imports: [PageHeader, RankedBars],
  templateUrl: './admin-locations.html',
})
export class AdminLocationsPage implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly locations = signal<AdminLocationStats[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly bars = computed<RankedBarItem[]>(() =>
    this.locations().map((l) => ({ label: l.location, value: l.tournamentsCount })),
  );

  ngOnInit(): void {
    this.adminService.getLocationStats().subscribe({
      next: (locations) => {
        this.locations.set(locations);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
