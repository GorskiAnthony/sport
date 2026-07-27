import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUserSummary } from '../../../core/models/admin.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-admin-clients-page',
  standalone: true,
  imports: [RouterLink, PageHeader],
  templateUrl: './admin-clients.html',
})
export class AdminClientsPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private searchTimeout?: ReturnType<typeof setTimeout>;

  readonly clients = signal<AdminUserSummary[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly skeletons = [1, 2, 3];

  ngOnInit(): void {
    this.load();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 300);
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.searchUsers(this.search()).subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
