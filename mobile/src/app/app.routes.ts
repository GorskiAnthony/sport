import { Routes } from '@angular/router';

// La route 'tournaments' (écran d'accueil de l'organisateur connecté, protégée par
// authGuard) est ajoutée avec l'écran liste de tournois.
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
