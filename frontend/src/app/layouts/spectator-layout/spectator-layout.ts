import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastContainer } from '../../shared/ui/toast-container/toast-container';

interface SpectatorNavItem {
  path: string;
  label: string;
  icon: 'home' | 'tournament' | 'sports' | 'standings' | 'heart' | 'bell' | 'settings';
  end: boolean;
}

const NAV: SpectatorNavItem[] = [
  { path: '/home', label: 'Accueil', icon: 'home', end: true },
  { path: '/home/tournaments', label: 'Tournois', icon: 'tournament', end: false },
  { path: '/home/sports', label: 'Sports', icon: 'sports', end: false },
  { path: '/home/standings', label: 'Classements', icon: 'standings', end: false },
  { path: '/home/favorites', label: 'Favoris', icon: 'heart', end: false },
  { path: '/home/notifications', label: 'Notifications', icon: 'bell', end: false },
];

const NAV_BOTTOM: SpectatorNavItem[] = [{ path: '/home/settings', label: 'Paramètres', icon: 'settings', end: false }];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-spectator-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer],
  templateUrl: './spectator-layout.html',
})
export class SpectatorLayout implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  readonly nav = NAV;
  readonly navBottom = NAV_BOTTOM;
  readonly user = this.authService.currentUser;
  readonly sidebarOpen = signal(false);
  readonly unreadCount = this.notificationService.unreadCount;
  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  });

  constructor() {
    // Voir le commentaire équivalent dans DashboardLayout : ces pages n'appellent pas
    // setPageMeta, donc sans ça l'onglet garde le titre de la dernière page publique visitée.
    this.syncTitle();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.syncTitle());
  }

  ngOnInit(): void {
    this.notificationService.refreshUnreadCount();
  }

  private syncTitle(): void {
    const active = [...this.nav, ...this.navBottom].find((item) => this.router.isActive(item.path, item.end));
    this.title.setTitle(`${active?.label ?? 'Espace spectateur'} | Matchday`);
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
