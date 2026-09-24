import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  ToastController,
} from '@ionic/angular/standalone';
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
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonInput, IonItem, IonLabel],
})
export class AccountPage implements ViewWillEnter {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  readonly user = this.authService.currentUser;

  readonly name = signal('');
  readonly avatarUrl = signal<string | null>(null);
  readonly bannerUrl = signal<string | null>(null);
  readonly saving = signal(false);

  readonly isOrganizer = computed(() => this.user()?.role === 'ORGANIZER');

  readonly initials = computed(() => {
    const name = this.name().trim();
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
    this.authService.refreshUser().subscribe({
      next: (user) => this.syncForm(user.name, user.avatarUrl, user.bannerUrl),
      error: () => {
        const current = this.user();
        if (current) this.syncForm(current.name, current.avatarUrl, current.bannerUrl);
      },
    });
  }

  onNameInput(value: string | null | undefined): void {
    this.name.set(value ?? '');
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => this.avatarUrl.set((ev.target?.result as string) ?? null);
    reader.readAsDataURL(file);
  }

  onBannerSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => this.bannerUrl.set((ev.target?.result as string) ?? null);
    reader.readAsDataURL(file);
  }

  save(): void {
    if (!this.name().trim()) {
      void this.showToast('Le nom est requis.', 'danger');
      return;
    }

    this.saving.set(true);
    this.authService
      .updateProfile({ name: this.name(), avatarUrl: this.avatarUrl(), bannerUrl: this.bannerUrl() })
      .subscribe({
        next: () => {
          this.saving.set(false);
          void this.showToast('Profil mis à jour.', 'success');
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          const message = (err.error as { message?: string } | null)?.message ?? 'Une erreur est survenue.';
          void this.showToast(message, 'danger');
        },
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private syncForm(name: string, avatarUrl: string | null, bannerUrl: string | null): void {
    this.name.set(name);
    this.avatarUrl.set(avatarUrl);
    this.bannerUrl.set(bannerUrl);
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}
