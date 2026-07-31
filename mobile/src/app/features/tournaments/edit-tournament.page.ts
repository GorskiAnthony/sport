import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonText,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';
import { TournamentService } from '../../core/services/tournament.service';
import { SPORTS } from '../../shared/utils/sports';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';

interface FormErrors {
  name?: string;
  sport?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

const CATEGORIES = [
  { value: 'u13', label: 'U13' },
  { value: 'u15', label: 'U15' },
  { value: 'u17', label: 'U17' },
  { value: 'u18', label: 'U18' },
  { value: 'senior', label: 'Senior' },
];

/** Portage mobile de frontend/src/app/features/dashboard/edit-tournament/edit-tournament.ts —
 *  champs de base uniquement, sans règlement personnalisé ni sponsor (réservés au plan PRO,
 *  hors périmètre mobile v1, voir le plan de portage). */
@Component({
  selector: 'app-edit-tournament',
  templateUrl: './edit-tournament.page.html',
  styleUrls: ['./edit-tournament.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonText,
    IonSpinner,
    EmptyStateComponent,
  ],
})
export class EditTournamentPage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  constructor() {
    addIcons({ alertCircleOutline });
  }

  // Lu par le template pour construire le defaultHref de ion-back-button — pas private.
  tournamentId!: number;

  readonly sports = SPORTS;
  readonly categories = CATEGORIES;

  readonly name = signal('');
  readonly sport = signal('');
  readonly category = signal('');
  readonly location = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly maxTeams = signal('');
  readonly description = signal('');
  readonly terrains = signal('');

  readonly errors = signal<FormErrors>({});
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly saving = signal(false);

  ionViewWillEnter(): void {
    this.tournamentId = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.notFound.set(false);
    this.tournamentService.getById(this.tournamentId).subscribe({
      next: (tournament) => {
        this.name.set(tournament.name);
        this.sport.set(tournament.sport);
        this.category.set(tournament.category);
        this.location.set(tournament.location ?? '');
        this.startDate.set(tournament.startDate);
        this.endDate.set(tournament.endDate);
        this.maxTeams.set(String(tournament.maxTeams));
        this.description.set(tournament.description ?? '');
        this.terrains.set(tournament.terrains ?? '');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  onNameInput(value: string | null | undefined): void {
    this.name.set(value ?? '');
  }

  onSportChange(value: string | null | undefined): void {
    this.sport.set(value ?? '');
  }

  onCategoryChange(value: string | null | undefined): void {
    this.category.set(value ?? '');
  }

  onLocationInput(value: string | null | undefined): void {
    this.location.set(value ?? '');
  }

  onStartDateInput(value: string | null | undefined): void {
    this.startDate.set(value ?? '');
  }

  onEndDateInput(value: string | null | undefined): void {
    this.endDate.set(value ?? '');
  }

  onMaxTeamsInput(value: string | null | undefined): void {
    this.maxTeams.set(value ?? '');
  }

  onDescriptionInput(value: string | null | undefined): void {
    this.description.set(value ?? '');
  }

  onTerrainsInput(value: string | null | undefined): void {
    this.terrains.set(value ?? '');
  }

  private validate(): FormErrors {
    const next: FormErrors = {};
    if (!this.name().trim()) next.name = 'Requis.';
    if (!this.sport()) next.sport = 'Requis.';
    if (!this.category()) next.category = 'Requis.';
    if (!this.startDate()) next.startDate = 'Requis.';
    if (!this.endDate()) next.endDate = 'Requis.';
    else if (this.endDate() < this.startDate()) next.endDate = 'Doit être après le début.';
    return next;
  }

  submit(): void {
    if (this.saving()) return;

    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.errors.set(errors);
      return;
    }

    this.errors.set({});
    this.saving.set(true);
    this.tournamentService
      .update(this.tournamentId, {
        name: this.name(),
        sport: this.sport(),
        category: this.category(),
        // La colonne "location" est NOT NULL en base — toujours envoyer la chaîne (même vide),
        // jamais undefined (qui serait omis du JSON et ferait échouer l'insertion).
        location: this.location(),
        startDate: this.startDate(),
        endDate: this.endDate(),
        maxTeams: Number(this.maxTeams()) || 14,
        description: this.description() || undefined,
        terrains: this.terrains() || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          void this.showToast('Tournoi mis à jour.', 'success');
          this.router.navigate(['/tournaments', this.tournamentId]);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          const message = (err.error as { message?: string } | null)?.message ?? 'Erreur lors de la mise à jour.';
          void this.showToast(message, 'danger');
        },
      });
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}
