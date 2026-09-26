import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { ToastService } from '../../../core/services/toast.service';

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuit',
  CLASSIC: 'Classic',
  PRO: 'Pro',
};

const PLAN_BADGE_CLASSES: Record<string, string> = {
  FREE: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  CLASSIC: 'bg-green-500/20 text-green-400 border-green-500/30',
  PRO: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-settings-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings.html',
})
export class DashboardSettingsPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toast = inject(ToastService);

  readonly user = this.authService.currentUser;
  readonly name = signal(this.user()?.name ?? '');
  readonly avatarUrl = signal(this.user()?.avatarUrl ?? '');
  readonly bannerUrl = signal(this.user()?.bannerUrl ?? '');
  readonly portalLoading = signal(false);
  readonly saving = signal(false);

  ngOnInit(): void {
    // Retour possible depuis le portail de facturation Stripe (annulation/downgrade) : le plan
    // local peut être obsolète tant qu'on n'a pas resynchronisé avec le serveur.
    this.authService.refreshUser().subscribe({ error: () => {} });
  }

  planLabel(): string {
    return PLAN_LABELS[this.user()?.plan ?? 'FREE'];
  }

  planBadgeClass(): string {
    return PLAN_BADGE_CLASSES[this.user()?.plan ?? 'FREE'];
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => this.avatarUrl.set((ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  }

  onBannerSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => this.bannerUrl.set((ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  }

  saveProfile(): void {
    if (!this.name().trim()) {
      this.toast.error('Le nom est requis.');
      return;
    }

    this.saving.set(true);
    this.authService
      .updateProfile({
        name: this.name(),
        avatarUrl: this.avatarUrl() || null,
        bannerUrl: this.bannerUrl() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Paramètres sauvegardés.', 'Enregistré');
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          const message = (err.error as { message?: string } | null)?.message;
          this.toast.error(message ?? 'Une erreur est survenue.', 'Erreur');
        },
      });
  }

  openBillingPortal(): void {
    this.portalLoading.set(true);
    this.subscriptionService.portal().subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: () => {
        this.portalLoading.set(false);
        this.toast.error("Aucun abonnement actif à gérer.", 'Erreur');
      },
    });
  }
}
