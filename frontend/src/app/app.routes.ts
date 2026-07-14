import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleRedirectGuard } from './core/auth/role-redirect.guard';
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
    ],
  },
  {
    path: '',
    component: PublicLayoutNoFooter,
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginPage) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterPage) },
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
    ],
  },
  { path: '**', redirectTo: '' },
];
