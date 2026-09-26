import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { LucideTarget, LucideZap, LucideShieldCheck } from '@lucide/angular';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Button } from '../../shared/ui/button/button';
import { setPageMeta, setCanonical } from '../../shared/utils/seo';

type ValueIcon = 'target' | 'zap' | 'shield';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-about-page',
  standalone: true,
  imports: [PageHeader, Button, RouterLink, LucideTarget, LucideZap, LucideShieldCheck],
  templateUrl: './about.html',
})
export class AboutPage {
  constructor() {
    const document = inject(DOCUMENT);
    const origin = document.location.origin;
    const url = `${origin}/about`;

    setPageMeta(inject(Title), inject(Meta), {
      title: 'À propos',
      description: 'Matchday simplifie la gestion de tournois sportifs : inscriptions, classements en direct et calendrier des matchs, pour les organisateurs comme pour les spectateurs.',
      url,
      image: `${origin}/hero.png`,
    });
    setCanonical(document, url);
  }

  readonly values: { icon: ValueIcon; title: string; desc: string }[] = [
    {
      icon: 'target',
      title: 'Simplicité',
      desc: 'Une interface intuitive pour que chaque organisateur puisse se lancer en quelques minutes.',
    },
    {
      icon: 'zap',
      title: 'Performance',
      desc: 'Conçu pour supporter des milliers de connexions simultanées lors de grands événements.',
    },
    {
      icon: 'shield',
      title: 'Sécurité',
      desc: 'Données chiffrées, authentification sécurisée et infrastructure haute disponibilité.',
    },
  ];

  readonly team = [{ name: 'Anthony G.', role: 'Fondateur & CTO', avatar: '/anthony.jpeg' }];
}
