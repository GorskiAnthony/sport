import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  // Scanner intégré, pour rejoindre un tournoi supplémentaire une fois l'app déjà installée —
  // le tout premier scan d'un arbitre passe toujours par l'appareil photo du système
  // (voir join/:token) et n'a donc jamais besoin de cette page ni de la permission caméra.
  {
    path: 'scan',
    loadComponent: () => import('./features/scan/scan.page').then((m) => m.ScanPage),
  },
  // Atterrissage du QR code d'un tournoi — pas de authGuard, le token dans l'URL est le
  // justificatif (voir TournamentSessionService).
  {
    path: 'join/:token',
    loadComponent: () => import('./features/join/join.page').then((m) => m.JoinPage),
  },
  // Coquille de navigation par onglets (Tournois / Compte) pour le flux organisateur — voir
  // features/tabs/tabs.page.ts. Path vide : ne consomme aucun segment d'URL, donc
  // '/tournaments' et '/account' restent les mêmes URLs qu'avant l'ajout des tabs. Les écrans
  // poussés par-dessus (détail, création, live, arbitrage...) restent des routes sœurs plus bas
  // dans ce fichier, montées par le ion-router-outlet racine : y naviguer remplace entièrement
  // cette coquille, et la tab bar disparaît (comportement volontaire, voir le plan de refonte).
  {
    path: '',
    loadComponent: () => import('./features/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      // Sans ce redirect, un atterrissage sur '' (path vide de la coquille ci-dessus, donc pas
      // de segment enfant à matcher) laisse le <ion-router-outlet> de TabsPage sans route
      // active : la tab bar s'affiche mais le contenu reste vide tant qu'on n'a pas tapé un
      // onglet pour déclencher une première navigation explicite.
      { path: '', pathMatch: 'full', redirectTo: 'tournaments' },
      {
        path: 'tournaments',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/tournaments/tournament-list.page').then((m) => m.TournamentListPage),
      },
      {
        path: 'account',
        canActivate: [authGuard],
        loadComponent: () => import('./features/account/account.page').then((m) => m.AccountPage),
      },
    ],
  },
  // Doit précéder 'tournaments/:id' (même longueur de chemin) — sinon Angular essaierait de
  // parser "new" comme un id.
  {
    path: 'tournaments/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tournaments/new-tournament.page').then((m) => m.NewTournamentPage),
  },
  {
    path: 'tournaments/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tournaments/tournament-detail.page').then((m) => m.TournamentDetailPage),
  },
  {
    path: 'tournaments/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tournaments/edit-tournament.page').then((m) => m.EditTournamentPage),
  },
  {
    path: 'tournaments/:id/live',
    canActivate: [authGuard],
    loadComponent: () => import('./features/live-score/live-score.page').then((m) => m.LiveScorePage),
  },
  {
    path: 'tournaments/:id/planning',
    canActivate: [authGuard],
    loadComponent: () => import('./features/planning/planning.page').then((m) => m.PlanningPage),
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
