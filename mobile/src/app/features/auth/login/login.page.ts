import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/auth/auth.service';
import { defaultRouteForRole } from '../../../shared/utils/default-route-for-role';

interface FormErrors {
  email?: string;
  password?: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
  ],
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  readonly email = signal('');
  readonly password = signal('');
  readonly errors = signal<FormErrors>({});
  readonly loading = signal(false);

  onEmailInput(value: string | null | undefined): void {
    this.email.set(value ?? '');
  }

  onPasswordInput(value: string | null | undefined): void {
    this.password.set(value ?? '');
  }

  submit(): void {
    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.errors.set(errors);
      return;
    }

    this.errors.set({});
    this.loading.set(true);
    this.authService.login({ email: this.email(), password: this.password() }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.router.navigate([defaultRouteForRole(response.user.role)]);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        void this.handleError(err);
      },
    });
  }

  private validate(): FormErrors {
    const next: FormErrors = {};
    if (!this.email()) next.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(this.email())) next.email = 'Email invalide.';
    if (!this.password()) next.password = 'Le mot de passe est requis.';
    return next;
  }

  private async handleError(err: HttpErrorResponse): Promise<void> {
    const code = (err.error as { code?: string } | null)?.code;

    if (code === 'EMAIL_NOT_FOUND') {
      this.errors.set({ email: 'Aucun compte trouvé avec cet email.' });
      return;
    }
    if (code === 'WRONG_PASSWORD') {
      this.errors.set({ password: 'Mot de passe incorrect.' });
      return;
    }

    const message =
      code === 'ACCOUNT_LOCKED'
        ? 'Trop de tentatives échouées. Réessayez dans quelques minutes.'
        : 'Une erreur est survenue. Réessayez.';
    const toast = await this.toastController.create({ message, duration: 3000, color: 'danger', position: 'top' });
    await toast.present();
  }
}
