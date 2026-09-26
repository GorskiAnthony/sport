import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

/**
 * En prod, apiUrl est un chemin relatif ('/api', voir environment.docker.ts) : le navigateur le
 * résout via nginx (proxy_pass vers le conteneur backend). Le process Node SSR, lui, n'a pas de
 * nginx devant lui pour résoudre ce chemin relatif — sans réécriture, HttpClient tenterait de
 * fetch('/api/...') côté serveur, ce qui échoue faute d'origine. On réécrit donc uniquement côté
 * serveur vers l'URL interne du conteneur backend (réseau Docker).
 */
export const serverApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPlatformServer(inject(PLATFORM_ID)) && req.url.startsWith('/api/')) {
    const base = (typeof process !== 'undefined' && process.env?.['INTERNAL_API_URL']) || 'http://backend:3000/api';
    return next(req.clone({ url: base + req.url.slice('/api'.length) }));
  }
  return next(req);
};
