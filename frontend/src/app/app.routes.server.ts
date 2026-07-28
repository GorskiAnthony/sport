import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Pages marketing statiques, sans appel backend : générées une fois au build.
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'sports', renderMode: RenderMode.Prerender },
  { path: 'organizers', renderMode: RenderMode.Prerender },
  { path: 'pricing', renderMode: RenderMode.Prerender },

  // Contenu dynamique (tournois créés en continu) : rendu serveur à chaque requête, pas au build.
  { path: '', renderMode: RenderMode.Server },
  { path: 'tournaments', renderMode: RenderMode.Server },
  { path: 't/:id', renderMode: RenderMode.Server },

  // Tout le reste (auth, espace spectateur/organisateur connecté, admin, impression,
  // retours Stripe) est derrière connexion ou sans intérêt SEO : reste en CSR pur, comme avant.
  { path: '**', renderMode: RenderMode.Client },
];
