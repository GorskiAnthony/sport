import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-spectator-settings-page',
  standalone: true,
  templateUrl: './settings.html',
})
export class SpectatorSettingsPage {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly user = this.authService.currentUser;
  readonly name = signal(this.user()?.name ?? '');
  readonly avatarUrl = signal(this.user()?.avatarUrl ?? '');
  readonly saving = signal(false);

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => this.avatarUrl.set((ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  }

  save(): void {
    if (!this.name().trim()) {
      this.toast.error('Le nom est requis.');
      return;
    }

    this.saving.set(true);
    this.authService
      .updateProfile({ name: this.name(), avatarUrl: this.avatarUrl() || null, bannerUrl: this.user()?.bannerUrl ?? null })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Paramètres sauvegardés.');
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          const message = (err.error as { message?: string } | null)?.message;
          this.toast.error(message ?? 'Une erreur est survenue.', 'Erreur');
        },
      });
  }
}
