import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TournamentSessionService } from './tournament-session.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const tournamentSessionService = inject(TournamentSessionService);
  if (authService.isAuthenticated() || tournamentSessionService.isActive()) {
    return true;
  }

  return inject(Router).createUrlTree(['/login']);
};
