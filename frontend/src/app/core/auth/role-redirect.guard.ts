import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guards the public home route ('') — mirrors HomePage.jsx's role-based
 * <Navigate> redirect from the React reference app, moved into a router guard.
 */
export const roleRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  if (!user) {
    return true;
  }

  if (user.role === 'ADMIN') {
    return router.createUrlTree(['/admin']);
  }

  return router.createUrlTree([user.role === 'ORGANIZER' ? '/dashboard' : '/home']);
};
