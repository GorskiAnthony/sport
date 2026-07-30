import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ViewWillEnter } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonText,
  IonSpinner,
  IonIcon,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, addOutline } from 'ionicons/icons';
import { TournamentService } from '../../core/services/tournament.service';
import { TeamService } from '../../core/services/team.service';
import { BracketService } from '../../core/services/bracket.service';
import { AuthService } from '../../core/auth/auth.service';
import { TournamentFormat } from '../../core/models/tournament.model';
import { Plan } from '../../core/models/user.model';
import { FormatPicker } from '../../shared/ui/format-picker/format-picker';
import { todayIsoDate } from '../../shared/utils/today';
import { SPORTS } from '../../shared/utils/sports';

interface FormErrors {
  name?: string;
  sport?: string;
  category?: string;
  format?: string;
  startDate?: string;
  endDate?: string;
}

interface TeamRow {
  name: string;
  category: string;
}

const MAX_TOURNAMENTS_BY_PLAN: Record<Plan, number> = { FREE: 1, CLASSIC: Infinity, PRO: Infinity };

const CATEGORIES = [
  { value: 'u13', label: 'U13' },
  { value: 'u15', label: 'U15' },
  { value: 'u17', label: 'U17' },
  { value: 'u18', label: 'U18' },
  { value: 'senior', label: 'Senior' },
];

const TEAM_CATEGORIES = ['U13', 'U15', 'U16', 'U17', 'U18', 'Senior'];

/** Portage mobile de frontend/src/app/features/dashboard/new-tournament/new-tournament.ts —
 *  même logique en deux étapes (détails puis équipes + format + génération du tableau), sans
 *  les champs PRO ni l'Event Pass (voir le plan de portage). */
@Component({
  selector: 'app-new-tournament',
  templateUrl: './new-tournament.page.html',
  styleUrls: ['./new-tournament.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonText,
    IonSpinner,
    IonIcon,
    FormatPicker,
  ],
})
export class NewTournamentPage implements ViewWillEnter {
  private readonly tournamentService = inject(TournamentService);
  private readonly teamService = inject(TeamService);
  private readonly bracketService = inject(BracketService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  readonly sports = SPORTS;
  readonly categories = CATEGORIES;
  readonly teamCategories = TEAM_CATEGORIES;

  readonly step = signal<1 | 2>(1);
  readonly planBlocked = signal(false);
  readonly createdTournamentId = signal<number | null>(null);

  readonly name = signal('');
  readonly sport = signal('');
  readonly category = signal('');
  readonly format = signal<TournamentFormat | null>(null);
  readonly location = signal('');
  readonly startDate = signal(todayIsoDate());
  readonly endDate = signal('');
  readonly maxTeams = signal('');
  readonly description = signal('');
  readonly groupCount = signal('4');

  readonly errors = signal<FormErrors>({});
  readonly loading = signal(false);
  readonly finishing = signal(false);
  readonly teams = signal<TeamRow[]>([]);

  constructor() {
    addIcons({ trashOutline, addOutline });
  }

  ionViewWillEnter(): void {
    const plan = this.authService.currentUser()?.plan ?? 'FREE';
    const limit = MAX_TOURNAMENTS_BY_PLAN[plan];
    this.tournamentService.getMine().subscribe((tournaments) => {
      this.planBlocked.set(tournaments.length >= limit);
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

  onGroupCountInput(value: string | null | undefined): void {
    this.groupCount.set(value ?? '4');
  }

  private validate(): FormErrors {
    const next: FormErrors = {};
    if (!this.name().trim()) next.name = 'Requis.';
    if (!this.sport()) next.sport = 'Requis.';
    if (!this.category()) next.category = 'Requis.';
    if (!this.format()) next.format = 'Choisissez un format.';
    if (!this.startDate()) next.startDate = 'Requis.';
    if (!this.endDate()) next.endDate = 'Requis.';
    else if (this.endDate() < this.startDate()) next.endDate = 'Doit être après le début.';
    return next;
  }

  submitStepOne(): void {
    if (this.loading()) return;

    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.errors.set(errors);
      return;
    }

    this.errors.set({});
    this.loading.set(true);
    this.tournamentService
      .create({
        name: this.name(),
        sport: this.sport(),
        category: this.category(),
        location: this.location() || undefined,
        startDate: this.startDate(),
        endDate: this.endDate(),
        maxTeams: Number(this.maxTeams()) || 14,
        description: this.description() || undefined,
      })
      .subscribe({
        next: (created) => {
          this.createdTournamentId.set(created.id);
          this.loading.set(false);
          this.step.set(2);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          void this.handleCreateError(err);
        },
      });
  }

  addTeamRow(): void {
    this.teams.update((rows) => [...rows, { name: '', category: 'U15' }]);
  }

  removeTeamRow(index: number): void {
    this.teams.update((rows) => rows.filter((_, i) => i !== index));
  }

  updateTeamRowName(index: number, value: string | null | undefined): void {
    const name = value ?? '';
    this.teams.update((rows) => rows.map((row, i) => (i === index ? { ...row, name } : row)));
  }

  updateTeamRowCategory(index: number, value: string | null | undefined): void {
    const category = value ?? 'U15';
    this.teams.update((rows) => rows.map((row, i) => (i === index ? { ...row, category } : row)));
  }

  finish(): void {
    const tournamentId = this.createdTournamentId();
    const format = this.format();
    if (!tournamentId || !format) return;

    const rowsToCreate = this.teams().filter((t) => t.name.trim());
    if (rowsToCreate.length === 0) {
      void this.showToast(
        'Ajoutez au moins 2 équipes pour générer le tableau automatiquement (possible depuis la fiche du tournoi).',
        'medium',
      );
      this.router.navigate(['/tournaments']);
      return;
    }

    if (format === 'GROUP_KNOCKOUT' && Math.floor(rowsToCreate.length / Number(this.groupCount())) < 3) {
      void this.showToast('Avec ce nombre de poules, certaines poules auraient moins de 3 équipes.', 'danger');
      return;
    }

    this.finishing.set(true);
    forkJoin(
      rowsToCreate.map((row) => this.teamService.create({ name: row.name, category: row.category, tournamentId })),
    ).subscribe({
      next: () => {
        if (rowsToCreate.length < 2) {
          this.finishing.set(false);
          void this.showToast(
            'Tournoi et équipe créés. Ajoutez au moins 2 équipes pour générer le tableau automatiquement.',
            'medium',
          );
          this.router.navigate(['/tournaments']);
          return;
        }

        const groupCount = format === 'GROUP_KNOCKOUT' ? Number(this.groupCount()) : undefined;
        this.bracketService.generate(tournamentId, format, groupCount).subscribe({
          next: () => {
            this.finishing.set(false);
            void this.showToast('Tournoi créé et tableau généré !', 'success');
            this.router.navigate(['/tournaments']);
          },
          error: () => {
            this.finishing.set(false);
            void this.showToast(
              "Les équipes ont été ajoutées, mais la génération du tableau a échoué. Réessayez depuis la fiche du tournoi.",
              'danger',
            );
            this.router.navigate(['/tournaments']);
          },
        });
      },
      error: () => {
        this.finishing.set(false);
        void this.showToast("Une erreur est survenue lors de l'ajout des équipes.", 'danger');
      },
    });
  }

  async confirmCancel(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Annuler la création ?',
      message: 'Votre tournoi ne sera pas sauvegardé.',
      buttons: [
        { text: 'Continuer', role: 'cancel' },
        { text: 'Annuler quand même', role: 'confirm', handler: () => this.router.navigate(['/tournaments']) },
      ],
    });
    await alert.present();
  }

  private async handleCreateError(err: HttpErrorResponse): Promise<void> {
    if (err.status === 403) {
      await this.showToast(
        'Limite de tournois atteinte pour votre offre. Passez à un plan supérieur depuis le site web pour en créer davantage.',
        'danger',
      );
      return;
    }
    const message = (err.error as { message?: string } | null)?.message ?? 'Erreur lors de la création.';
    await this.showToast(message, 'danger');
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'medium'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}
