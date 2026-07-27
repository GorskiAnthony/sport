import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideTrophy, LucideShuffle, LucideChartColumn, LucideLink2, LucideMapPin } from '@lucide/angular';
import { Button } from '../../shared/ui/button/button';
import { SportIcon } from '../../shared/ui/sport-icon/sport-icon';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentSummary } from '../../core/models/tournament.model';
import { SPORTS } from '../../shared/utils/sports';

type FeatureIcon = 'trophy' | 'shuffle' | 'chart' | 'link';

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [Button, RouterLink, SportIcon, LucideTrophy, LucideShuffle, LucideChartColumn, LucideLink2, LucideMapPin],
  templateUrl: './home.html',
})
export class HomePage implements OnInit {
  private readonly tournamentService = inject(TournamentService);

  readonly upcomingTournaments = signal<TournamentSummary[] | null>(null);
  readonly stats = signal<Stat[] | null>(null);

  ngOnInit(): void {
    this.tournamentService.getAll().subscribe({
      next: (tournaments) => {
        const upcoming = tournaments
          .filter((t) => t.status !== 'FINISHED')
          .sort((a, b) => a.startDate.localeCompare(b.startDate))
          .slice(0, 3);
        this.upcomingTournaments.set(upcoming);

        const teamsCount = tournaments.reduce((sum, t) => sum + t.teamsCount, 0);
        this.stats.set([
          { value: tournaments.length, suffix: '', label: 'Tournois organisés' },
          { value: teamsCount, suffix: '', label: 'Équipes inscrites' },
          { value: SPORTS.length, suffix: '', label: 'Sports couverts' },
        ]);
      },
      error: () => {
        this.upcomingTournaments.set([]);
        this.stats.set(null);
      },
    });
  }

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
