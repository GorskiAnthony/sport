import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';
import { ToastContainer } from '../../shared/ui/toast-container/toast-container';
import { setJsonLd } from '../../shared/utils/seo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, ToastContainer],
  templateUrl: './public-layout.html',
})
export class PublicLayout {
  /** Posé une seule fois pour toutes les pages publiques (clé "site", distincte du bloc "event"/
   *  "faq" que certaines pages posent en plus — voir setJsonLd) : décrit l'organisation Matchday
   *  elle-même, indépendamment du contenu de la page visitée. */
  constructor() {
    const document = inject(DOCUMENT);
    const origin = document.location.origin;
    setJsonLd(document, {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Matchday',
          url: origin,
          logo: `${origin}/logo.png`,
        },
        {
          '@type': 'WebSite',
          name: 'Matchday',
          url: origin,
          // Vrai côté produit : /tournaments lit et écrit ?search= dans l'URL (voir
          // TournamentsPage.syncQueryParams) — ne pas déclarer ici une capacité qui n'existerait
          // pas côté frontend.
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${origin}/tournaments?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    }, 'site');
  }
}
