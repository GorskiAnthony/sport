// Le scanner in-app (voir QrScannerService) s'appuie sur la Barcode Detection API côté web —
// pas encore supportée par tous les navigateurs, ce polyfill couvre le reste (utile pour tester
// via `ionic serve`, avant même de builder pour iOS/Android où le plugin passe par ML Kit natif).
import 'barcode-detector/polyfill';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { provideAppInitializer, inject } from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { AuthService } from './app/core/auth/auth.service';
import { TournamentSessionService } from './app/core/auth/tournament-session.service';
import { ConnectivityService } from './app/core/services/connectivity.service';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    // withEnabledBlockingInitialNavigation : sur device natif, la toute première navigation
    // (souvent directement dans un onglet si une session est déjà restaurée) peut résoudre
    // avant que les web components Ionic (<ion-tabs>, <ion-router-outlet>) soient complètement
    // initialisés — la page reste alors invisible (classe ion-page-invisible jamais retirée)
    // tant qu'aucune interaction ne force Ionic à resynchroniser. Le mode "blocking" attend la
    // fin de la navigation initiale avant le premier rendu, pour éviter cette course.
    provideRouter(routes, withPreloading(PreloadAllModules), withEnabledBlockingInitialNavigation()),
    // withXsrfConfiguration : sans effet en natif (pas de cookies) ; nécessaire sur le build web
    // pour les mêmes raisons que frontend/app.config.ts — voir SecurityConfig côté backend.
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    // Recharge le token/user stockés (Capacitor Preferences, async) avant tout rendu, pour que
    // les guards et l'intercepteur voient un état cohérent dès le premier écran.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
    // Même raison, pour une session de tournoi obtenue via QR code (voir
    // TournamentSessionService) — sans ça, un arbitre qui relance l'app est renvoyé sur
    // /login et doit rescanner le QR code physique.
    provideAppInitializer(() => inject(TournamentSessionService).restoreSession()),
    // Le mode hors-ligne de l'écran arbitre (voir ScoreQueueService) a besoin de connaître
    // l'état réseau dès le premier rendu, pas seulement après un premier changement.
    provideAppInitializer(() => inject(ConnectivityService).init()),
  ],
});
