import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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

  save(): void {
    this.toast.success('Paramètres sauvegardés.');
  }
}
