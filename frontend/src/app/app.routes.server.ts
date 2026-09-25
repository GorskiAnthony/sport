import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Pages marketing statiques, sans appel backend : générées une fois au build.
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'organizers', renderMode: RenderMode.Prerender },
  { path: 'pricing', renderMode: RenderMode.Prerender },

  // Contenu dynamique (tournois créés en continu) : rendu serveur à chaque requête, pas au build.
  // /sports affiche désormais un vrai décompte de tournois par sport (plus une table figée) :
  // prérendre figerait ce chiffre à la valeur du moment du build (voire à 0, l'API n'étant pas
  // joignable pendant le build CI) au lieu de le recalculer à chaque visite.
  { path: '', renderMode: RenderMode.Server },
  { path: 'sports', renderMode: RenderMode.Server },
  { path: 'tournaments', renderMode: RenderMode.Server },
  { path: 't/:id', renderMode: RenderMode.Server },

  // Tout le reste (auth, espace spectateur/organisateur connecté, admin, impression,
  // retours Stripe) est derrière connexion ou sans intérêt SEO : reste en CSR pur, comme avant.
  { path: '**', renderMode: RenderMode.Client },
];
