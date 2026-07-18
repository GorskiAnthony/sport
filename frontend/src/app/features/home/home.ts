import { Component } from '@angular/core';
import { LucideTrophy, LucideShuffle, LucideChartColumn, LucideLink2 } from '@lucide/angular';
import { Button } from '../../shared/ui/button/button';

type FeatureIcon = 'trophy' | 'shuffle' | 'chart' | 'link';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [Button, LucideTrophy, LucideShuffle, LucideChartColumn, LucideLink2],
  templateUrl: './home.html',
})
export class HomePage {
  readonly features: { title: string; description: string; icon: FeatureIcon }[] = [
    {
      title: 'Prêt en 5 minutes',
      description: 'Choisissez votre sport, ajoutez vos équipes : votre tournoi est en ligne avant la fin de votre café.',
      icon: 'trophy',
    },
    {
      title: 'Zéro calcul, zéro erreur',
      description: 'Poules ou élimination directe : le tableau se construit tout seul et enchaîne les tours à votre place.',
      icon: 'shuffle',
    },
    {
      title: 'Le direct, sans rafraîchir',
      description: 'Scores, classements et stats se mettent à jour en temps réel, sous les yeux de vos spectateurs.',
      icon: 'chart',
    },
    {
      title: 'Un lien, et tout le monde suit',
      description: 'Un lien public et un QR code : vos spectateurs suivent le tournoi sans compte ni téléchargement.',
      icon: 'link',
    },
  ];
}
