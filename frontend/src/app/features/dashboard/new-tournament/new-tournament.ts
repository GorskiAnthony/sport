import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { TeamService } from '../../../core/services/team.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Button } from '../../../shared/ui/button/button';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { FormSelect, FormSelectOption } from '../../../shared/ui/form-select/form-select';
import { ConfirmModal } from '../../../shared/ui/confirm-modal/confirm-modal';

interface FormErrors {
  name?: string;
  sport?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

interface TeamRow {
  name: string;
  category: string;
}

const MAX_TOURNAMENTS_BY_PLAN: Record<string, number> = {
  FREE: 1,
  CLASSIC: Infinity,
  PRO: Infinity,
};

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

const TEAM_CATEGORIES = ['U13', 'U15', 'U16', 'U17', 'U18', 'Senior'];

@Component({
  selector: 'app-dashboard-new-tournament-page',
  standalone: true,
  imports: [RouterLink, Button, FormInput, FormSelect, ConfirmModal],
  templateUrl: './new-tournament.html',
})
export class DashboardNewTournamentPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly teamService = inject(TeamService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly sports = SPORTS;
  readonly categories = CATEGORIES;
  readonly formats = FORMATS;
  readonly teamCategories = TEAM_CATEGORIES;

  readonly step = signal<1 | 2>(1);
  readonly planBlocked = signal(false);
  readonly cancelOpen = signal(false);
  readonly createdTournamentId = signal<number | null>(null);
  readonly finishing = signal(false);

  readonly name = signal('');
  readonly sport = signal('');
  readonly category = signal('');
  readonly format = signal('');
  readonly location = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly maxTeams = signal('');
  readonly description = signal('');

  readonly errors = signal<FormErrors>({});
  readonly loading = signal(false);
  readonly teams = signal<TeamRow[]>([]);

  ngOnInit(): void {
    const plan = this.authService.currentUser()?.plan ?? 'FREE';
    const limit = MAX_TOURNAMENTS_BY_PLAN[plan] ?? 1;
    this.tournamentService.getMine().subscribe((tournaments) => {
      if (tournaments.length >= limit) {
        this.planBlocked.set(true);
      }
    });
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

  submitStepOne(): void {
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
        next: (created) => {
          this.createdTournamentId.set(created.id);
          this.loading.set(false);
          this.step.set(2);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Erreur lors de la création.');
        },
      });
  }

  addTeamRow(): void {
    this.teams.update((rows) => [...rows, { name: '', category: 'U15' }]);
  }

  removeTeamRow(index: number): void {
    this.teams.update((rows) => rows.filter((_, i) => i !== index));
  }

  updateTeamRow(index: number, field: keyof TeamRow, value: string): void {
    this.teams.update((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  finish(): void {
    const tournamentId = this.createdTournamentId();
    if (!tournamentId) return;

    const rowsToCreate = this.teams().filter((t) => t.name.trim());
    if (rowsToCreate.length === 0) {
      this.toast.success('Tournoi créé !', 'Succès');
      this.router.navigate(['/dashboard/tournaments']);
      return;
    }

    this.finishing.set(true);
    forkJoin(
      rowsToCreate.map((row) =>
        this.teamService.create({ name: row.name, category: row.category, tournamentId }),
      ),
    ).subscribe({
      next: () => {
        this.finishing.set(false);
        this.toast.success('Tournoi et équipes créés !', 'Succès');
        this.router.navigate(['/dashboard/tournaments']);
      },
      error: () => {
        this.finishing.set(false);
        this.toast.error("Une erreur est survenue lors de l'ajout des équipes.");
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/tournaments']);
  }
}
