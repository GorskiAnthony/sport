import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/models/user.model';
import { ToastService } from '../../../core/services/toast.service';
import { AuthCard } from '../../../shared/ui/auth-card/auth-card';
import { Button } from '../../../shared/ui/button/button';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { PasswordInput } from '../../../shared/ui/password-input/password-input';
import { sanitizeReturnUrl } from '../../../shared/utils/safe-return-url';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

const ROLES: { id: Extract<Role, 'ORGANIZER' | 'SPECTATOR'>; label: string }[] = [
  { id: 'ORGANIZER', label: 'Organisateur' },
  { id: 'SPECTATOR', label: 'Spectateur' },
];

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RouterLink, AuthCard, FormInput, PasswordInput, Button],
  templateUrl: './register.html',
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly roles = ROLES;
  readonly queryParams = this.route.snapshot.queryParams;
  private readonly requestedRole = this.route.snapshot.queryParamMap.get('role');
  private readonly returnUrl = sanitizeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  readonly role = signal<Role>(this.requestedRole === 'SPECTATOR' ? 'SPECTATOR' : 'ORGANIZER');
  readonly subtitle = signal(
    this.requestedRole === 'SPECTATOR'
      ? 'Créez un compte spectateur gratuit pour suivre vos équipes favorites et être notifié de leurs matchs.'
      : 'Rejoignez la communauté Tournoi Center.',
  );
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly errors = signal<FormErrors>({});
  readonly loading = signal(false);

  selectRole(role: Role): void {
    this.role.set(role);
  }

  private validate(): FormErrors {
    const next: FormErrors = {};
    if (!this.name().trim()) next.name = 'Le nom est requis.';
    if (!this.email()) next.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(this.email())) next.email = 'Email invalide.';
    if (!this.password()) next.password = 'Le mot de passe est requis.';
    else if (this.password().length < 8) next.password = '8 caractères minimum.';
    return next;
  }

  submit(): void {
    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.errors.set(errors);
      return;
    }

    this.loading.set(true);
    this.authService
      .register({ name: this.name(), email: this.email(), password: this.password(), role: this.role() })
      .subscribe({
        next: (response) => {
          this.toast.success('Votre compte a été créé avec succès.', 'Bienvenue !');
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
          if (code === 'EMAIL_TAKEN') {
            this.errors.set({ email: 'Un compte existe déjà avec cet email.' });
            this.toast.error('Un compte existe déjà avec cet email.', 'Email déjà utilisé');
          } else {
            this.toast.error('Une erreur est survenue. Veuillez réessayer.', 'Erreur');
          }
        },
      });
  }
}
