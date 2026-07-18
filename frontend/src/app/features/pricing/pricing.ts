import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PlanTier, SubscriptionService } from '../../core/services/subscription.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Button } from '../../shared/ui/button/button';

interface Plan {
  id: 'free' | PlanTier;
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  highlighted: boolean;
  badge?: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: 'pour toujours',
    description: 'Pour se lancer sans risque et organiser vos premiers tournois.',
    cta: 'Commencer gratuitement',
    highlighted: false,
    features: [
      '1 tournoi actif',
      "Jusqu'à 14 équipes",
      'Tableau de bord basique',
      'QR code de partage',
      'Support communautaire',
    ],
  },
  {
    id: 'classic',
    name: 'Classic',
    price: '19€',
    period: '/ mois',
    description: 'Pour les organisateurs réguliers qui ne veulent plus de limites.',
    cta: "Démarrer l'essai gratuit",
    highlighted: true,
    badge: 'Populaire',
    features: [
      'Tournois illimités',
      'Équipes illimitées',
      'Résultats en temps réel',
      'Export PDF des classements',
      'Support par email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '49€',
    period: '/ mois',
    description: "Pour les grands événements qui ne peuvent pas se permettre un pépin.",
    cta: 'Discuter de mon projet',
    highlighted: false,
    badge: 'Haute dispo',
    features: [
      'Tout le plan Classic',
      "Jusqu'à 48 équipes par tournoi",
      '2 000 – 3 000 connexions simultanées',
      'Tournois scindables (split tournament)',
      'Règles personnalisées',
      'Infra dédiée + SLA 99.9%',
      'Support prioritaire 24/7',
    ],
  },
];

const FAQ = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. La facturation est calculée au prorata.',
  },
  {
    q: 'Y a-t-il un engagement ?',
    a: 'Non, les plans Classic et Pro sont sans engagement. Vous pouvez annuler à tout moment.',
  },
  {
    q: 'Le plan gratuit est-il vraiment gratuit ?',
    a: "Oui, sans carte bancaire requise. Vous pouvez l'utiliser indéfiniment.",
  },
  {
    q: "Qu'est-ce qu'un tournoi scindable (Pro) ?",
    a: 'Un gros tournoi de 48 équipes peut être automatiquement divisé en deux sous-tournois parallèles avec classements fusionnés.',
  },
];

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [PageHeader, Button],
  templateUrl: './pricing.html',
})
export class PricingPage {
  private readonly authService = inject(AuthService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly plans = PLANS;
  readonly faq = FAQ;
  readonly loadingPlan = signal<string | null>(null);

  selectPlan(plan: Plan): void {
    if (plan.id === 'free') {
      this.router.navigate(['/register']);
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/register']);
      return;
    }

    this.loadingPlan.set(plan.id);
    this.subscriptionService.checkout(plan.id as PlanTier).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err: HttpErrorResponse) => {
        this.loadingPlan.set(null);
        this.toast.error('Une erreur est survenue lors de la création de la session de paiement.', 'Erreur');
      },
    });
  }
}
