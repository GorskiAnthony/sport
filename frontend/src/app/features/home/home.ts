import { Component } from '@angular/core';
import { Button } from '../../shared/ui/button/button';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [Button],
  templateUrl: './home.html',
})
export class HomePage {
  readonly features = [
    {
      title: 'Créez votre tournoi',
      description: "Configurez équipes, phases et calendrier en quelques minutes.",
      icon: '🏆',
    },
    {
      title: 'Suivez en direct',
      description: 'Scores, classements et statistiques mis à jour en temps réel.',
      icon: '📊',
    },
    {
      title: 'Partagez facilement',
      description: 'Un lien public et un QR code pour vos spectateurs.',
      icon: '🔗',
    },
  ];
}
