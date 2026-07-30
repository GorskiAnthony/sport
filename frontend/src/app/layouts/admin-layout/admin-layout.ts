import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastContainer } from '../../shared/ui/toast-container/toast-container';

interface AdminNavItem {
  path: string;
  label: string;
  icon: 'overview' | 'clients' | 'tournament' | 'locations';
  end: boolean;
}

const NAV: AdminNavItem[] = [
  { path: '/admin', label: "Vue d'ensemble", icon: 'overview', end: true },
  { path: '/admin/clients', label: 'Clients', icon: 'clients', end: false },
  { path: '/admin/tournaments', label: 'Tournois', icon: 'tournament', end: false },
  { path: '/admin/locations', label: 'Localisations', icon: 'locations', end: false },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly nav = NAV;
  readonly user = this.authService.currentUser;
  readonly sidebarOpen = signal(false);
  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  });

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
