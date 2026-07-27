import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthCard } from '../../../shared/ui/auth-card/auth-card';
import { Button } from '../../../shared/ui/button/button';
import { PasswordInput } from '../../../shared/ui/password-input/password-input';

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [RouterLink, AuthCard, PasswordInput, Button],
  templateUrl: './reset-password.html',
})
export class ResetPasswordPage {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly token = this.route.snapshot.queryParamMap.get('token');

  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly errors = signal<FormErrors>({});
  readonly loading = signal(false);
  readonly invalidToken = signal(!this.token);

  private validate(): FormErrors {
    const next: FormErrors = {};
    if (!this.password()) next.password = 'Le mot de passe est requis.';
    else if (this.password().length < 12) next.password = '12 caractères minimum.';
    if (this.confirmPassword() !== this.password()) next.confirmPassword = 'Les mots de passe ne correspondent pas.';
    return next;
  }

  submit(): void {
    if (!this.token) {
      this.invalidToken.set(true);
      return;
    }

    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.errors.set(errors);
      return;
    }

    this.loading.set(true);
    this.authService.resetPassword(this.token, this.password()).subscribe({
      next: () => {
        this.toast.success('Vous pouvez maintenant vous connecter.', 'Mot de passe mis à jour');
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const code = (err.error as { code?: string } | null)?.code;
        if (code === 'INVALID_RESET_TOKEN') {
          this.invalidToken.set(true);
        } else {
          this.toast.error('Une erreur est survenue. Réessayez.', 'Erreur');
        }
      },
    });
  }
}
