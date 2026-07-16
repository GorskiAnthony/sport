import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthCard } from '../../../shared/ui/auth-card/auth-card';
import { Button } from '../../../shared/ui/button/button';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { PasswordInput } from '../../../shared/ui/password-input/password-input';
import { sanitizeReturnUrl } from '../../../shared/utils/safe-return-url';

interface FormErrors {
  email?: string;
  password?: string;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterLink, AuthCard, FormInput, PasswordInput, Button],
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly queryParams = this.route.snapshot.queryParams;
  private readonly returnUrl = sanitizeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));

  readonly email = signal('');
  readonly password = signal('');
  readonly errors = signal<FormErrors>({});
  readonly loading = signal(false);

  private validate(): FormErrors {
    const next: FormErrors = {};
    if (!this.email()) next.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(this.email())) next.email = 'Email invalide.';
    if (!this.password()) next.password = 'Le mot de passe est requis.';
    return next;
  }

  submit(): void {
    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.errors.set(errors);
      return;
    }

    this.loading.set(true);
    this.authService.login({ email: this.email(), password: this.password() }).subscribe({
      next: (response) => {
        this.toast.success(`Bon retour, ${response.user.name} !`, 'Connexion réussie');
        this.loading.set(false);
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.router.navigate([response.user.role === 'ORGANIZER' ? '/dashboard' : '/home']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const code = (err.error as { code?: string } | null)?.code;
        if (code === 'EMAIL_NOT_FOUND') {
          this.errors.set({ email: 'Aucun compte trouvé avec cet email.' });
          this.toast.error('Aucun compte trouvé avec cet email.', 'Email inconnu');
        } else if (code === 'WRONG_PASSWORD') {
          this.errors.set({ password: 'Mot de passe incorrect.' });
          this.toast.error('Vérifiez votre mot de passe.', 'Mot de passe incorrect');
        } else {
          this.toast.error('Une erreur est survenue. Réessayez.', 'Erreur');
        }
      },
    });
  }
}
