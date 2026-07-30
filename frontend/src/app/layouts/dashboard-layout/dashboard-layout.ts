import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastContainer } from '../../shared/ui/toast-container/toast-container';
import { DashboardRightPanel } from './right-panel/right-panel';

const COLLAPSE_KEY = 'dashboardSidebarCollapsed';

interface DashboardNavItem {
  path: string;
  label: string;
  icon: 'dashboard' | 'tournament' | 'teams' | 'matches' | 'standings' | 'buvette' | 'messages' | 'settings';
  end: boolean;
}

const NAV: DashboardNavItem[] = [
  { path: '/dashboard', label: 'Tableau de bord', icon: 'dashboard', end: true },
  { path: '/dashboard/tournaments', label: 'Tournois', icon: 'tournament', end: false },
  { path: '/dashboard/teams', label: 'Équipes', icon: 'teams', end: false },
  { path: '/dashboard/matches', label: 'Matchs', icon: 'matches', end: false },
  { path: '/dashboard/standings', label: 'Classements', icon: 'standings', end: false },
  { path: '/dashboard/buvette', label: 'Buvette', icon: 'buvette', end: false },
  { path: '/dashboard/messages', label: 'Messages', icon: 'messages', end: false },
  { path: '/dashboard/settings', label: 'Paramètres', icon: 'settings', end: false },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer, DashboardRightPanel],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly nav = NAV;
  readonly user = this.authService.currentUser;
  readonly sidebarOpen = signal(false);
  readonly collapsed = signal(this.isBrowser && localStorage.getItem(COLLAPSE_KEY) === 'true');
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

  toggleCollapsed(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    if (this.isBrowser) localStorage.setItem(COLLAPSE_KEY, String(next));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
