import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Voir le commentaire dans auth.guard.ts / AuthService.restoreSession.
  await authService.restoreSession();

  if (authService.currentUser()?.role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/']);
};
