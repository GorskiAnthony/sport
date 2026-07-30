import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LucideTarget, LucideZap, LucideShieldCheck } from '@lucide/angular';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { setPageMeta } from '../../shared/utils/seo';

type ValueIcon = 'target' | 'zap' | 'shield';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-about-page',
  standalone: true,
  imports: [PageHeader, LucideTarget, LucideZap, LucideShieldCheck],
  templateUrl: './about.html',
})
export class AboutPage {
  constructor() {
    setPageMeta(inject(Title), inject(Meta), {
      title: 'À propos',
      description: 'Tournoi Center simplifie la gestion de tournois sportifs : inscriptions, classements en direct et calendrier des matchs, pour les organisateurs comme pour les spectateurs.',
    });
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

  readonly team = [{ name: 'Anthony G.', role: 'Fondateur & CTO', initials: 'AG' }];
}
