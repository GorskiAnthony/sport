import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';
import { Plan } from '../../core/models/user.model';

interface PlanMeta {
  label: string;
  textColor: string;
  bgColor: string;
}

// Couleurs secondaires du design-system (purple/blue, "utilisées avec parcimonie" — voir
// .claude/skills/design-system) : ne concernent que ce badge d'offre, pas de raison d'étendre
// shared/ui/status-badge (dont la palette reste alignée sur les statuts tournoi/match).
const PLAN_META: Record<Plan, PlanMeta> = {
  FREE: { label: 'Gratuit', textColor: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.15)' },
  CLASSIC: { label: 'Classic', textColor: '#60a5fa', bgColor: 'rgba(59, 130, 246, 0.15)' },
  PRO: { label: 'Pro', textColor: '#c084fc', bgColor: 'rgba(168, 85, 247, 0.15)' },
};

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon],
})
export class AccountPage implements ViewWillEnter {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.authService.currentUser;

  readonly initials = computed(() => {
    const name = this.user()?.name.trim() ?? '';
    if (!name) return '?';
    const parts = name.split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  });

  readonly planMeta = computed(() => PLAN_META[this.user()?.plan ?? 'FREE']);

  constructor() {
    addIcons({ logOutOutline });
  }

  // Rafraîchit le plan/nom affichés (ex. changement d'offre depuis le site web) — échec
  // silencieux, on garde les données déjà en cache plutôt que d'ajouter un état d'erreur pour un
  // cas non bloquant.
  ionViewWillEnter(): void {
    this.authService.refreshUser().subscribe({ error: () => {} });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
