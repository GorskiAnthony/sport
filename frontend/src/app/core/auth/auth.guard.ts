import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Attend la même promesse mémoïsée que provideAppInitializer (app.config.ts) — au cas où
  // cette toute première navigation se résout avant elle (voir le commentaire dans
  // AuthService.restoreSession) : sans ça, un utilisateur avec une session cookie valide se
  // retrouverait renvoyé sur /login au démarrage.
  await authService.restoreSession();

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
