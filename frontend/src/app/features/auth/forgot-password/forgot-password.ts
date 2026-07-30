import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthCard } from '../../../shared/ui/auth-card/auth-card';
import { Button } from '../../../shared/ui/button/button';
import { FormInput } from '../../../shared/ui/form-input/form-input';

interface FormErrors {
  email?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [RouterLink, AuthCard, FormInput, Button],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordPage {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly email = signal('');
  readonly errors = signal<FormErrors>({});
  readonly loading = signal(false);
  readonly sent = signal(false);

  private validate(): FormErrors {
    const next: FormErrors = {};
    if (!this.email()) next.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(this.email())) next.email = 'Email invalide.';
    return next;
  }

  submit(): void {
    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.errors.set(errors);
      return;
    }

    this.loading.set(true);

    this.authService.forgotPassword(this.email()).subscribe({
      next: () => {
        // Always the same message regardless of whether the account exists — never leak that here.
        this.loading.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Une erreur est survenue. Réessayez.', 'Erreur');
      },
    });
  }
}
