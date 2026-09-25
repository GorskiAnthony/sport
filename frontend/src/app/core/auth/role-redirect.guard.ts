import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { defaultRouteForRole } from '../../shared/utils/default-route-for-role';
import { AuthService } from './auth.service';

/**
 * Guards the public home route ('') — mirrors HomePage.jsx's role-based
 * <Navigate> redirect from the React reference app, moved into a router guard.
 */
export const roleRedirectGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Voir le commentaire dans auth.guard.ts / AuthService.restoreSession.
  await authService.restoreSession();

  const user = authService.currentUser();
  if (!user) {
    return true;
  }

  return router.createUrlTree([defaultRouteForRole(user.role)]);
};
