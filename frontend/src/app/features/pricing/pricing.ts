import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { EventPassService } from '../../core/services/event-pass.service';
import { PlanTier, SubscriptionService } from '../../core/services/subscription.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Button } from '../../shared/ui/button/button';
import { BillingPeriod, BillingToggle } from './billing-toggle/billing-toggle';
import { setPageMeta } from '../../shared/utils/seo';

type Pricing =
  | { kind: 'fixed'; price: string; period: string }
  | { kind: 'recurring'; monthly: number; annual: number };

interface Plan {
  id: 'free' | PlanTier;
  name: string;
  description: string;
  cta: string;
  highlighted: boolean;
  badge?: string;
  features: string[];
  pricing: Pricing;
}

type PlanCtaState = 'current' | 'manage' | 'switch' | 'default';

interface EventPass {
  name: string;
  description: string;
  price: string;
  period: string;
  cta: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    description: 'Pour se lancer sans risque et organiser vos premiers tournois.',
    cta: 'Commencer gratuitement',
    highlighted: false,
    pricing: { kind: 'fixed', price: '0€', period: 'pour toujours' },
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
    description: 'Pour les organisateurs réguliers qui ne veulent plus de limites.',
    cta: "Démarrer l'essai gratuit",
    highlighted: true,
    badge: 'Populaire',
    pricing: { kind: 'recurring', monthly: 19, annual: 190 },
    features: [
      'Tournois illimités',
      'Équipes illimitées',
      'Résultats en temps réel',
      'Planning multi-terrains',
      'Export PDF des classements',
      'Support par email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les grands événements qui ne peuvent pas se permettre un pépin.',
    cta: 'Discuter de mon projet',
    highlighted: false,
    badge: 'Haute dispo',
    pricing: { kind: 'recurring', monthly: 49, annual: 490 },
    features: [
      'Tout le plan Classic',
      'Support prioritaire 24/7',
      "Tournois jusqu'à 128 équipes dans un même bracket",
      'Règlement personnalisé affiché aux équipes',
      'Bannière sponsor avec suivi des clics',
    ],
  },
];

const EVENT_PASS: EventPass = {
  name: 'Pass Événement',
  description: "Juste un tournoi ? Pas besoin d'abonnement.",
  price: '12€',
  period: 'paiement unique',
  cta: 'Créer mon tournoi - 12 €',
  features: [
    '1 tournoi, sans engagement',
    'Équipes illimitées pour cet événement',
    'Résultats en temps réel',
    'Export PDF des classements',
    'QR code de partage',
    "Accès jusqu'à 7 jours après l'événement",
  ],
};

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
    q: 'Y a-t-il une limite au nombre d\'équipes (Pro) ?',
    a: "Les plans Classic et Pro n'ont pas de limite d'équipes au global, mais un même bracket (poule ou tableau à élimination directe) est plafonné à 128 équipes pour rester lisible et performant.",
  },
  {
    q: 'Quelle différence entre le Pass Événement et un abonnement ?',
    a: "Le Pass Événement est un paiement unique de 12 € pour organiser un seul tournoi, sans engagement ni abonnement. Si vous organisez plusieurs tournois dans l'année, l'abonnement Classic (tournois illimités) devient plus avantageux dès le 2e événement.",
  },
  {
    q: "L'abonnement annuel, comment ça marche ?",
    a: "En choisissant la facturation annuelle, vous bénéficiez de 2 mois offerts par rapport au tarif mensuel. Vous pouvez passer du mensuel à l'annuel à tout moment.",
  },
];

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [PageHeader, Button, BillingToggle],
  templateUrl: './pricing.html',
})
export class PricingPage {
  private readonly authService = inject(AuthService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly eventPassService = inject(EventPassService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly plans = PLANS;
  readonly eventPass = EVENT_PASS;
  readonly faq = FAQ;
  readonly loadingPlan = signal<string | null>(null);
  readonly loadingEventPass = signal(false);
  readonly billing = signal<BillingPeriod>('monthly');

  constructor() {
    setPageMeta(inject(Title), inject(Meta), {
      title: 'Tarifs',
      description: 'Classic, Pro ou Pass Événement : choisissez la formule adaptée à vos tournois, mensuelle ou annuelle.',
    });
  }

  planCtaState(plan: Plan): PlanCtaState {
    if (!this.authService.isAuthenticated()) {
      return 'default';
    }

    const currentPlan = this.authService.currentUser()?.plan ?? 'FREE';
    if (plan.id.toUpperCase() === currentPlan) {
      return 'current';
    }

    // Repasser au gratuit revient à résilier l'abonnement en cours, pas à en créer un nouveau.
    return plan.id === 'free' ? 'manage' : 'switch';
  }

  priceInfo(plan: Plan): { amount: string; period: string; note?: string } {
    if (plan.pricing.kind === 'fixed') {
      return { amount: plan.pricing.price, period: plan.pricing.period };
    }

    const { monthly, annual } = plan.pricing;
    if (this.billing() === 'monthly') {
      return { amount: `${monthly}€`, period: '/ mois' };
    }

    const equivalentMonthly = Math.round(annual / 12);
    return {
      amount: `${annual}€`,
      period: '/ an',
      note: `≈ ${equivalentMonthly}€/mois, facturé annuellement`,
    };
  }

  selectPlan(plan: Plan): void {
    if (plan.id === 'free') {
      this.router.navigate(['/register']);
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/register']);
      return;
    }

    // Déjà un abonnement payant en cours : on modifie l'abonnement Stripe existant
    // (proratisé) plutôt que d'en ouvrir un second par-dessus.
    if ((this.authService.currentUser()?.plan ?? 'FREE') !== 'FREE') {
      this.changePlan(plan);
      return;
    }

    this.loadingPlan.set(plan.id);
    this.subscriptionService.checkout(plan.id as PlanTier, this.billing()).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err: HttpErrorResponse) => {
        this.loadingPlan.set(null);
        this.toast.error(
          'Une erreur est survenue lors de la création de la session de paiement.',
          'Erreur',
        );
      },
    });
  }

  private changePlan(plan: Plan): void {
    this.loadingPlan.set(plan.id);
    this.subscriptionService.changePlan(plan.id as PlanTier, this.billing()).subscribe({
      next: (res) => {
        this.loadingPlan.set(null);
        this.authService.updatePlan(res.plan);
        this.router.navigate(['/checkout/success'], { queryParams: { plan: plan.id } });
      },
      error: () => {
        this.loadingPlan.set(null);
        this.toast.error('Une erreur est survenue lors du changement de plan.', 'Erreur');
      },
    });
  }

  selectEventPass(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/register']);
      return;
    }

    this.loadingEventPass.set(true);
    this.eventPassService.checkout().subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: () => {
        this.loadingEventPass.set(false);
        this.toast.error(
          'Une erreur est survenue lors de la création de la session de paiement.',
          'Erreur',
        );
      },
    });
  }
}
