import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  // Atterrissage du QR code d'un tournoi — pas de authGuard, le token dans l'URL est le
  // justificatif (voir TournamentSessionService).
  {
    path: 'join/:token',
    loadComponent: () => import('./features/join/join.page').then((m) => m.JoinPage),
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
    path: 'tournaments/:id/referee-code',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tournaments/referee-code.page').then((m) => m.RefereeCodePage),
  },
  // Route partagée entre l'organisateur (depuis /tournaments/:id/live) et une session de
  // tournoi obtenue par QR code (depuis /join/:token) — les deux ont les mêmes droits sur un
  // match de ce tournoi côté backend (voir MatchService.requireCanManage), donc pas de
  // préfixe dans le chemin.
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
