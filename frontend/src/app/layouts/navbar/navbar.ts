import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Button } from '../../shared/ui/button/button';

interface NavLink {
  label: string;
  path: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Accueil', path: '/' },
  { label: 'Tournois', path: '/tournaments' },
  { label: 'Sports', path: '/sports' },
  { label: 'Équipes', path: '/teams' },
  { label: 'Tarifs', path: '/pricing' },
  { label: 'À propos', path: '/about' },
];

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Button],
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly navLinks = NAV_LINKS;
  readonly user = this.authService.currentUser;
  readonly mobileMenuOpen = signal(false);

  readonly spaceHref = computed(() => (this.user()?.role === 'ORGANIZER' ? '/dashboard' : '/home'));
  readonly spaceLabel = computed(() => (this.user()?.role === 'ORGANIZER' ? 'Mon dashboard' : 'Mon espace'));
  readonly avatarColor = computed(() =>
    this.user()?.role === 'ORGANIZER'
      ? 'bg-green-500/20 border-green-500/30 text-green-400'
      : 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  );
  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
