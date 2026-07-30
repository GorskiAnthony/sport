import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tournaments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tournaments/tournament-list.page').then((m) => m.TournamentListPage),
  },
  {
    path: 'tournaments/:id/live',
    canActivate: [authGuard],
    loadComponent: () => import('./features/live-score/live-score.page').then((m) => m.LiveScorePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
