import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
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
  private readonly title = inject(Title);

  readonly nav = NAV;
  readonly user = this.authService.currentUser;
  readonly sidebarOpen = signal(false);
  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  });

  constructor() {
    // Voir le commentaire équivalent dans DashboardLayout : les pages admin n'appellent pas
    // setPageMeta, donc sans ça l'onglet garde le titre de la dernière page publique visitée.
    this.syncTitle();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.syncTitle());
  }

  private syncTitle(): void {
    const active = this.nav.find((item) => this.router.isActive(item.path, item.end));
    this.title.setTitle(`${active?.label ?? 'Administration'} | Matchday`);
  }

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
