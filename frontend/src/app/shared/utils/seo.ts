import { inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

const SITE_NAME = 'Tournoi Center';

/** À appeler depuis un constructeur (ou un field initializer) de composant :
 *  Title/Meta ne peuvent être injectés que dans un contexte d'injection Angular. */
export function setPageMeta(title: string, description: string): void {
  inject(Title).setTitle(`${title} — ${SITE_NAME}`);
  inject(Meta).updateTag({ name: 'description', content: description });
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
