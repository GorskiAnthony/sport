import { Component } from '@angular/core';
import { PageHeader } from '../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [PageHeader],
  templateUrl: './about.html',
})
export class AboutPage {
  readonly values = [
    {
      icon: '🎯',
      title: 'Simplicité',
      desc: 'Une interface intuitive pour que chaque organisateur puisse se lancer en quelques minutes.',
    },
    {
      icon: '⚡',
      title: 'Performance',
      desc: 'Conçu pour supporter des milliers de connexions simultanées lors de grands événements.',
    },
    {
      icon: '🔒',
      title: 'Sécurité',
      desc: 'Données chiffrées, authentification sécurisée et infrastructure haute disponibilité.',
    },
  ];

  readonly team = [{ name: 'Anthony G.', role: 'Fondateur & CTO', initials: 'AG' }];
}
