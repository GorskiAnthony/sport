import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { roleRedirectGuard } from './core/auth/role-redirect.guard';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { PublicLayoutNoFooter } from './layouts/public-layout-no-footer/public-layout-no-footer';
import { SpectatorLayout } from './layouts/spectator-layout/spectator-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [roleRedirectGuard],
        loadComponent: () => import('./features/home/home').then((m) => m.HomePage),
      },
      { path: 'about', loadComponent: () => import('./features/about/about').then((m) => m.AboutPage) },
      { path: 'sports', loadComponent: () => import('./features/sports/sports').then((m) => m.SportsPage) },
      { path: 'organizers', loadComponent: () => import('./features/organizers/organizers').then((m) => m.OrganizersPage) },
      { path: 'pricing', loadComponent: () => import('./features/pricing/pricing').then((m) => m.PricingPage) },
      { path: 'tournaments', loadComponent: () => import('./features/tournaments/tournaments').then((m) => m.TournamentsPage) },
      {
        path: 't/:id',
        loadComponent: () => import('./features/public-tournament/public-tournament').then((m) => m.PublicTournamentPage),
      },
    ],
  },
  {
    path: '',
    component: PublicLayoutNoFooter,
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginPage) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterPage) },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPasswordPage),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then((m) => m.ResetPasswordPage),
      },
      {
        path: 'register/tournament',
        canActivate: [authGuard],
        loadComponent: () => import('./features/create-tournament/create-tournament').then((m) => m.CreateTournamentPage),
      },
      {
        path: 'register/add-team',
        canActivate: [authGuard],
        loadComponent: () => import('./features/add-team/add-team').then((m) => m.AddTeamPage),
      },
    ],
  },
  {
    path: 'home',
    component: SpectatorLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/spectator/spectator-home/spectator-home').then((m) => m.SpectatorHomePage),
      },
      { path: 'tournaments', loadComponent: () => import('./features/tournaments/tournaments').then((m) => m.TournamentsPage) },
      { path: 'sports', loadComponent: () => import('./features/sports/sports').then((m) => m.SportsPage) },
      {
        path: 'standings',
        loadComponent: () => import('./features/spectator/standings/standings').then((m) => m.SpectatorStandingsPage),
      },
      {
        path: 'favorites',
        loadComponent: () => import('./features/spectator/favorites/favorites').then((m) => m.SpectatorFavoritesPage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/spectator/notifications/notifications').then((m) => m.SpectatorNotificationsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/spectator/settings/settings').then((m) => m.SpectatorSettingsPage),
      },
    ],
  },
  {
    path: 'dashboard',
    component: DashboardLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard-home/dashboard-home').then((m) => m.DashboardHomePage),
      },
      {
        path: 'tournaments',
        loadComponent: () =>
          import('./features/dashboard/tournaments/tournaments').then((m) => m.DashboardTournamentsPage),
      },
      {
        path: 'tournaments/new',
        loadComponent: () =>
          import('./features/dashboard/new-tournament/new-tournament').then((m) => m.DashboardNewTournamentPage),
      },
      {
        path: 'tournaments/:id',
        loadComponent: () =>
          import('./features/dashboard/tournament-detail/tournament-detail').then((m) => m.DashboardTournamentDetailPage),
      },
      {
        path: 'tournaments/:id/edit',
        loadComponent: () =>
          import('./features/dashboard/edit-tournament/edit-tournament').then((m) => m.DashboardEditTournamentPage),
      },
      {
        path: 'teams',
        loadComponent: () => import('./features/dashboard/teams/teams').then((m) => m.DashboardTeamsPage),
      },
      {
        path: 'matches',
        loadComponent: () => import('./features/dashboard/matches/matches').then((m) => m.DashboardMatchesPage),
      },
      {
        path: 'matches/:id',
        loadComponent: () =>
          import('./features/dashboard/match-detail/match-detail').then((m) => m.DashboardMatchDetailPage),
      },
      {
        path: 'standings',
        loadComponent: () => import('./features/dashboard/standings/standings').then((m) => m.DashboardStandingsPage),
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/dashboard/messages/messages').then((m) => m.DashboardMessagesPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/dashboard/settings/settings').then((m) => m.DashboardSettingsPage),
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/admin-overview/admin-overview').then((m) => m.AdminOverviewPage),
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/admin/admin-clients/admin-clients').then((m) => m.AdminClientsPage),
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('./features/admin/admin-client-detail/admin-client-detail').then((m) => m.AdminClientDetailPage),
      },
      {
        path: 'tournaments',
        loadComponent: () =>
          import('./features/admin/admin-tournaments/admin-tournaments').then((m) => m.AdminTournamentsPage),
      },
      {
        path: 'locations',
        loadComponent: () =>
          import('./features/admin/admin-locations/admin-locations').then((m) => m.AdminLocationsPage),
      },
    ],
  },
  {
    path: 'print/tournaments/:id',
    loadComponent: () => import('./features/print-tournament/print-tournament').then((m) => m.PrintTournamentPage),
  },
  {
    path: 'checkout/success',
    loadComponent: () =>
      import('./features/checkout/checkout-success/checkout-success').then((m) => m.CheckoutSuccessPage),
  },
  {
    path: 'checkout/cancel',
    loadComponent: () =>
      import('./features/checkout/checkout-cancel/checkout-cancel').then((m) => m.CheckoutCancelPage),
  },
  { path: '**', loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFoundPage) },
];
