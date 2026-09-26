import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { serverApiInterceptor } from './core/interceptors/server-api.interceptor';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Default cookie/header names already match CookieCsrfTokenRepository on the backend
    // (XSRF-TOKEN / X-XSRF-TOKEN) — see SecurityConfig.
    provideHttpClient(
      withInterceptors([serverApiInterceptor, authInterceptor, errorInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    provideClientHydration(withEventReplay()),
    // Rehydrates the signed-in user from the httpOnly cookie (GET /auth/me) before the first
    // render — no-ops on the server (see AuthService.restoreSession), so SSR still renders
    // logged-out and the client catches up right after bootstrap.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
};
