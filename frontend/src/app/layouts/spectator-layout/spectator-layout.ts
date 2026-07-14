import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastContainer } from '../../shared/ui/toast-container/toast-container';

interface SpectatorNavItem {
  path: string;
  label: string;
  icon: 'home' | 'tournament' | 'sports' | 'teams' | 'standings' | 'heart' | 'settings';
  end: boolean;
}

const NAV: SpectatorNavItem[] = [
  { path: '/home', label: 'Accueil', icon: 'home', end: true },
  { path: '/home/tournaments', label: 'Tournois', icon: 'tournament', end: false },
  { path: '/home/sports', label: 'Sports', icon: 'sports', end: false },
  { path: '/home/teams', label: 'Équipes', icon: 'teams', end: false },
  { path: '/home/standings', label: 'Classements', icon: 'standings', end: false },
  { path: '/home/favorites', label: 'Favoris', icon: 'heart', end: false },
];

const NAV_BOTTOM: SpectatorNavItem[] = [{ path: '/home/settings', label: 'Paramètres', icon: 'settings', end: false }];

@Component({
  selector: 'app-spectator-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer],
  templateUrl: './spectator-layout.html',
})
export class SpectatorLayout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly nav = NAV;
  readonly navBottom = NAV_BOTTOM;
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
