import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
} from '@ionic/angular/standalone';
import { TournamentSessionService } from '../../core/auth/tournament-session.service';

/** Atterrissage du QR code d'un tournoi (voir mobile/README ou la page d'invitation
 *  organisateur) — pas de compte, pas de mot de passe : le token dans l'URL est le
 *  justificatif. Le nom est facultatif ("anonyme par défaut, possibilité d'ajouter l'arbitre
 *  si l'arbitre le veut bien"). */
@Component({
  selector: 'app-join',
  templateUrl: './join.page.html',
  styleUrls: ['./join.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner],
})
export class JoinPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentSessionService = inject(TournamentSessionService);

  private readonly token = String(this.route.snapshot.paramMap.get('token'));

  readonly refereeName = signal('');
  readonly loading = signal(false);
  readonly error = signal(false);

  onNameInput(value: string | null | undefined): void {
    this.refereeName.set(value ?? '');
  }

  join(): void {
    this.loading.set(true);
    this.error.set(false);
    const name = this.refereeName().trim();

    this.tournamentSessionService.join(this.token, name || undefined).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.router.navigate(['/tournaments', response.tournamentId, 'live']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}
