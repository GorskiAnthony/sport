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
    path: 'referee/matches',
    canActivate: [authGuard],
    loadComponent: () => import('./features/referee/referee-matches.page').then((m) => m.RefereeMatchesPage),
  },
  // Route partagée : l'organisateur (depuis /tournaments/:id/live) a les mêmes droits que
  // l'arbitre assigné sur le démarrage/score d'un match (voir MatchService.requireCanManage
  // côté backend) — pas de préfixe /referee ici, ce n'est plus un écran arbitre-only.
  {
    path: 'matches/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/referee/match-detail.page').then((m) => m.MatchDetailPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
