import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { LucideChartColumn, LucideShare, LucideRefreshCw } from '@lucide/angular';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Button } from '../../shared/ui/button/button';
import { setPageMeta, setCanonical } from '../../shared/utils/seo';

type BenefitIcon = 'chart' | 'share' | 'refresh';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organizers-page',
  standalone: true,
  imports: [PageHeader, Button, LucideChartColumn, LucideShare, LucideRefreshCw],
  templateUrl: './organizers.html',
})
export class OrganizersPage {
  constructor() {
    const document = inject(DOCUMENT);
    const origin = document.location.origin;
    const url = `${origin}/organizers`;

    setPageMeta(inject(Title), inject(Meta), {
      title: 'Pour les organisateurs',
      description: 'Créez votre tournoi, ajoutez vos équipes et gérez les scores en direct : le classement se met à jour automatiquement.',
      url,
      image: `${origin}/football-pitch-aerial.webp`,
    });
    setCanonical(document, url);
  }

  readonly steps = [
    {
      n: 1,
      title: 'Créez votre compte',
      desc: 'Inscription gratuite en moins de 2 minutes, sans carte bancaire. Vous accédez immédiatement à votre tableau de bord organisateur.',
    },
    {
      n: 2,
      title: 'Créez votre tournoi',
      desc: 'Sport, catégorie, dates, lieu, format (poule, élimination directe, mixte) : Matchday génère le calendrier et le tableau automatiquement.',
    },
    {
      n: 3,
      title: 'Ajoutez vos équipes',
      desc: 'Ajoutez-les manuellement ou laissez-les s\'inscrire elles-mêmes via un lien de check-in — plus de liste papier à recopier le jour J.',
    },
    {
      n: 4,
      title: 'Gérez en direct',
      desc: 'Saisissez les scores depuis votre téléphone : classement, calendrier et page publique se mettent à jour tout seuls, pour vous comme pour les spectateurs.',
    },
  ];

  readonly benefits: { icon: BenefitIcon; title: string; desc: string }[] = [
    {
      icon: 'chart',
      title: 'Classement 100% automatique',
      desc: 'Plus de calcul à la main : points, différence de buts et qualifications se recalculent à chaque score saisi.',
    },
    {
      icon: 'share',
      title: 'Partage en un lien ou un QR code',
      desc: "Vos équipes et vos spectateurs suivent le tournoi en direct sur une page publique, sans créer de compte.",
    },
    {
      icon: 'refresh',
      title: 'Mises à jour en temps réel',
      desc: 'Un score saisi sur le terrain apparaît immédiatement partout : dashboard, page publique, écran TV.',
    },
  ];
}
