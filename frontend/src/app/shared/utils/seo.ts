import { Meta, Title } from '@angular/platform-browser';

const SITE_NAME = 'Tournoi Center';

export interface PageMetaOptions {
  title: string;
  description: string;
  /** URL absolue de la page (og:url). Omise pour les pages prérendues au build (about, pricing...) :
   *  aucune requête réelle à ce moment-là, donc pas de domaine fiable à construire — le même build
   *  doit fonctionner derrière n'importe quel domaine sans reconstruction (voir deploy.md). */
  url?: string;
  /** URL absolue de l'image de partage (og:image / twitter:image). Même contrainte que `url` :
   *  seules les pages rendues à la demande (SSR "Server", pas "Prerender") peuvent la fournir de
   *  façon fiable, via document.location.origin au moment de la requête. */
  image?: string;
  type?: 'website' | 'article';
}

/** `title`/`meta` doivent être injectés par l'appelant (inject(Title)/inject(Meta)) : inject()
 *  n'est utilisable que dans un contexte d'injection Angular (constructeur, field initializer),
 *  alors que cette fonction est aussi appelée depuis des callbacks asynchrones (données chargées)
 *  où ce contexte n'existe plus.
 *  Pose le titre, la description, et le jeu complet Open Graph + Twitter Card nécessaire pour
 *  qu'un lien partagé (Slack, Discord, WhatsApp, X/Twitter, Facebook, iMessage...) affiche une
 *  vraie carte d'aperçu plutôt que le titre générique du site. */
export function setPageMeta(title: Title, meta: Meta, options: PageMetaOptions): void {
  const fullTitle = `${options.title} — ${SITE_NAME}`;

  title.setTitle(fullTitle);
  meta.updateTag({ name: 'description', content: options.description });

  meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
  meta.updateTag({ property: 'og:type', content: options.type ?? 'website' });
  meta.updateTag({ property: 'og:title', content: fullTitle });
  meta.updateTag({ property: 'og:description', content: options.description });
  meta.updateTag({ property: 'og:locale', content: 'fr_FR' });

  meta.updateTag({ name: 'twitter:card', content: options.image ? 'summary_large_image' : 'summary' });
  meta.updateTag({ name: 'twitter:title', content: fullTitle });
  meta.updateTag({ name: 'twitter:description', content: options.description });

  if (options.url) {
    meta.updateTag({ property: 'og:url', content: options.url });
  }
  if (options.image) {
    meta.updateTag({ property: 'og:image', content: options.image });
    meta.updateTag({ name: 'twitter:image', content: options.image });
  }
}

const JSON_LD_ID = 'app-json-ld';

/** Injecte (ou remplace) un unique <script type="application/ld+json"> dans le <head>.
 *  `document` doit être injecté par l'appelant (DOCUMENT depuis @angular/common) : inject() n'est
 *  utilisable que dans un contexte d'injection, alors que cette fonction est typiquement appelée
 *  depuis un callback asynchrone (données chargées) où ce contexte n'existe plus.
 *  Même mécanisme que Meta/Title (document.head direct, voir leur code source) donc pas moins fiable
 *  qu'eux en théorie — mais constaté occasionnellement absent en SSR selon le timing de la réponse
 *  HTTP par rapport à la capture de stabilité d'Angular (non reproduit sur Title/Meta dans nos tests,
 *  cause exacte non isolée). Dégradation silencieuse : au pire le rich result JSON-LD manque sur ce
 *  chargement, le reste de la page (titre, contenu) n'est pas affecté. */
export function setJsonLd(document: Document, data: object): void {
  document.getElementById(JSON_LD_ID)?.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = JSON_LD_ID;
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

const CANONICAL_ID = 'app-canonical';

/** Injecte (ou remplace) un unique <link rel="canonical">. Mêmes réserves de fiabilité SSR que
 *  setJsonLd ci-dessus (dégradation silencieuse, sans impact sur le reste de la page). Utile en
 *  particulier sur /t/:id-slug : le slug est libre, seul l'id fait foi, donc plusieurs URLs peuvent
 *  pointer vers le même tournoi — le canonical déclare laquelle indexer. */
export function setCanonical(document: Document, url: string): void {
  document.getElementById(CANONICAL_ID)?.remove();
  const link = document.createElement('link');
  link.rel = 'canonical';
  link.id = CANONICAL_ID;
  link.href = url;
  document.head.appendChild(link);
}
