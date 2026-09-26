import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Button } from '../../shared/ui/button/button';
import { setPageMeta, setCanonical, setJsonLd } from '../../shared/utils/seo';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ: FaqItem[] = [
  {
    q: 'Qu\'est-ce que Matchday ?',
    a: 'Matchday est une plateforme pour créer, gérer et suivre des tournois sportifs : inscription des équipes, génération du calendrier, classements et scores en temps réel, page publique de suivi partageable par lien ou QR code.',
  },
  {
    q: 'Combien de temps faut-il pour créer un tournoi ?',
    a: 'Quelques minutes : renseignez le sport, les dates, le format (poules, élimination directe ou mixte) et ajoutez vos équipes. Le calendrier est généré automatiquement.',
  },
  {
    q: 'Quels sports et formats sont supportés ?',
    a: 'Football, basketball, volleyball, tennis, esport et une quinzaine d\'autres sports (voir la page Sports), en poules, élimination directe ou format mixte poules + phase finale.',
  },
  {
    q: 'Mes équipes doivent-elles créer un compte ?',
    a: "Non. Vous pouvez ajouter les équipes vous-même, ou leur envoyer un lien de check-in qu'elles remplissent sans créer de compte. Les spectateurs suivent le tournoi sur la page publique, également sans compte.",
  },
  {
    q: 'Le classement est-il calculé automatiquement ?',
    a: 'Oui. À chaque score saisi, points, différence de buts/sets et qualifications sont recalculés automatiquement — aucune formule à tenir à jour de votre côté.',
  },
  {
    q: 'Puis-je gérer un tournoi sur plusieurs terrains en même temps ?',
    a: 'Oui, avec le planning multi-terrains (plans Classic et Pro) : les matchs de chaque terrain sont organisés et affichés séparément.',
  },
  {
    q: 'Le plan gratuit est-il vraiment gratuit ?',
    a: "Oui, sans carte bancaire requise, utilisable indéfiniment pour un tournoi actif jusqu'à 14 équipes. Voir le détail sur la page Tarifs.",
  },
  {
    q: 'Quelle différence entre le Pass Événement et un abonnement ?',
    a: "Le Pass Événement est un paiement unique de 12 € pour organiser un seul tournoi, sans engagement. Si vous organisez plusieurs tournois dans l'année, l'abonnement Classic devient plus avantageux dès le 2ᵉ événement.",
  },
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment ; la facturation est calculée au prorata. Voir la page Tarifs pour le détail des plans.',
  },
  {
    q: 'Comment vous contacter ?',
    a: 'Par email à anthony.developpeurweb@gmail.com — nous répondons directement, sans formulaire ni ticket.',
  },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-faq-page',
  standalone: true,
  imports: [PageHeader, Button, RouterLink],
  templateUrl: './faq.html',
})
export class FaqPage {
  readonly faq = FAQ;

  constructor() {
    const document = inject(DOCUMENT);
    const origin = document.location.origin;
    const url = `${origin}/faq`;

    setPageMeta(inject(Title), inject(Meta), {
      title: 'FAQ',
      description: 'Toutes les réponses aux questions fréquentes sur Matchday : création de tournoi, formats, équipes, classement et tarifs.',
      url,
    });
    setCanonical(document, url);
    setJsonLd(document, {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    }, 'faq');
  }
}
