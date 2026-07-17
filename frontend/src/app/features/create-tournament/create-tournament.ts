import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TournamentService } from '../../core/services/tournament.service';
import { ToastService } from '../../core/services/toast.service';
import { Button } from '../../shared/ui/button/button';
import { FormInput } from '../../shared/ui/form-input/form-input';
import { FormSelect, FormSelectOption } from '../../shared/ui/form-select/form-select';
import { todayIsoDate } from '../../shared/utils/today';

interface FormErrors {
  name?: string;
  sport?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

const SPORTS: FormSelectOption[] = [
  { value: 'football', label: 'Football ⚽' },
  { value: 'futsal', label: 'Futsal' },
  { value: 'basketball', label: 'Basketball 🏀' },
  { value: 'handball', label: 'Handball 🤾' },
  { value: 'volleyball', label: 'Volleyball 🏐' },
  { value: 'rugby', label: 'Rugby 🏉' },
  { value: 'tennis', label: 'Tennis 🎾' },
  { value: 'esport', label: 'Esport 🎮' },
];

const CATEGORIES: FormSelectOption[] = [
  { value: 'u13', label: 'U13' },
  { value: 'u15', label: 'U15' },
  { value: 'u17', label: 'U17' },
  { value: 'u18', label: 'U18' },
  { value: 'senior', label: 'Senior' },
];

const FORMATS: FormSelectOption[] = [
  { value: 'groupes_elimination', label: 'Phase de groupes + Élimination' },
  { value: 'elimination', label: 'Élimination directe' },
  { value: 'poule', label: 'Poule unique' },
  { value: 'championnat', label: 'Championnat' },
];

@Component({
  selector: 'app-create-tournament-page',
  standalone: true,
  imports: [Button, FormInput, FormSelect],
  templateUrl: './create-tournament.html',
})
export class CreateTournamentPage {
  private readonly tournamentService = inject(TournamentService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly sports = SPORTS;
  readonly categories = CATEGORIES;
  readonly formats = FORMATS;

  readonly name = signal('');
  readonly sport = signal('');
  readonly category = signal('');
  readonly format = signal('');
  readonly location = signal('');
  readonly startDate = signal(todayIsoDate());
  readonly endDate = signal('');
  readonly maxTeams = signal('');
  readonly description = signal('');

  readonly errors = signal<FormErrors>({});
  readonly loading = signal(false);

  private validate(): FormErrors {
    const next: FormErrors = {};
    if (!this.name().trim()) next.name = 'Le nom est requis.';
    if (!this.sport()) next.sport = 'Choisissez un sport.';
    if (!this.category()) next.category = 'Choisissez une catégorie.';
    if (!this.startDate()) next.startDate = 'La date de début est requise.';
    if (!this.endDate()) next.endDate = 'La date de fin est requise.';
    else if (this.endDate() < this.startDate()) next.endDate = 'La date de fin doit être après le début.';
    return next;
  }

  submit(): void {
    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.errors.set(errors);
      return;
    }

    this.loading.set(true);
    this.tournamentService
      .create({
        name: this.name(),
        sport: this.sport(),
        category: this.category(),
        format: this.format() || undefined,
        location: this.location(),
        startDate: this.startDate(),
        endDate: this.endDate(),
        maxTeams: Number(this.maxTeams()) || 14,
        description: this.description() || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Votre tournoi a été créé.', 'Tournoi créé !');
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          const message = (err.error as { message?: string } | null)?.message;
          this.toast.error(message ?? 'Une erreur est survenue.', 'Erreur');
        },
      });
  }
}
