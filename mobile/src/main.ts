// Le scanner in-app (voir QrScannerService) s'appuie sur la Barcode Detection API côté web —
// pas encore supportée par tous les navigateurs, ce polyfill couvre le reste (utile pour tester
// via `ionic serve`, avant même de builder pour iOS/Android où le plugin passe par ML Kit natif).
import 'barcode-detector/polyfill';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideAppInitializer, inject } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { AuthService } from './app/core/auth/auth.service';
import { TournamentSessionService } from './app/core/auth/tournament-session.service';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Recharge le token/user stockés (Capacitor Preferences, async) avant tout rendu, pour que
    // les guards et l'intercepteur voient un état cohérent dès le premier écran.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
    // Même raison, pour une session de tournoi obtenue via QR code (voir
    // TournamentSessionService) — sans ça, un arbitre qui relance l'app est renvoyé sur
    // /login et doit rescanner le QR code physique.
    provideAppInitializer(() => inject(TournamentSessionService).restoreSession()),
  ],
});
