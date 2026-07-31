import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TournamentSessionService } from './tournament-session.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const tournamentSessionService = inject(TournamentSessionService);
  const router = inject(Router);

  // Attend la même promesse mémoïsée que provideAppInitializer (main.ts) — au cas où cette
  // toute première navigation se résout avant elle malgré withEnabledBlockingInitialNavigation
  // (voir le commentaire dans AuthService.restoreSession) : sans ça, un utilisateur avec une
  // session valide en stockage sécurisé se retrouvait renvoyé sur /login au démarrage.
  await Promise.all([authService.restoreSession(), tournamentSessionService.restoreSession()]);

  if (authService.isAuthenticated() || tournamentSessionService.isActive()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
