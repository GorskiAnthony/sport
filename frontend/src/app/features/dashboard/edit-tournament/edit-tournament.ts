import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Button } from '../../../shared/ui/button/button';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { FormSelect, FormSelectOption } from '../../../shared/ui/form-select/form-select';
import { SPORTS as SPORT_LIST } from '../../../shared/utils/sports';

interface FormErrors {
  name?: string;
  sport?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

const SPORTS: FormSelectOption[] = SPORT_LIST.map((sport) => ({
  value: sport.id,
  label: `${sport.label} ${sport.icon}`,
}));

const CATEGORIES: FormSelectOption[] = [
  { value: 'u13', label: 'U13' },
  { value: 'u15', label: 'U15' },
  { value: 'u17', label: 'U17' },
  { value: 'u18', label: 'U18' },
  { value: 'senior', label: 'Senior' },
];

@Component({
  selector: 'app-dashboard-edit-tournament-page',
  standalone: true,
  imports: [RouterLink, Button, FormInput, FormSelect],
  templateUrl: './edit-tournament.html',
})
export class DashboardEditTournamentPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(TournamentService);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);

  readonly isPro = this.authService.currentUser()?.plan === 'PRO';

  readonly sports = SPORTS;
  readonly categories = CATEGORIES;

  private readonly tournamentId = Number(this.route.snapshot.paramMap.get('id'));

  readonly loadingInitial = signal(true);
  readonly notFound = signal(false);
  readonly saving = signal(false);

  readonly name = signal('');
  readonly sport = signal('');
  readonly category = signal('');
  readonly location = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly maxTeams = signal('');
  readonly description = signal('');
  readonly rules = signal('');

  readonly errors = signal<FormErrors>({});

  ngOnInit(): void {
    if (!this.tournamentId) {
      this.notFound.set(true);
      this.loadingInitial.set(false);
      return;
    }

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
        this.rules.set(tournament.rules ?? '');
        this.loadingInitial.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loadingInitial.set(false);
      },
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

  submit(): void {
    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.errors.set(errors);
      return;
    }

    this.saving.set(true);
    this.tournamentService
      .update(this.tournamentId, {
        name: this.name(),
        sport: this.sport(),
        category: this.category(),
        location: this.location(),
        startDate: this.startDate(),
        endDate: this.endDate(),
        maxTeams: Number(this.maxTeams()) || 14,
        description: this.description() || undefined,
        rules: this.isPro ? this.rules() || undefined : undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Tournoi mis à jour.', 'Enregistré');
          this.router.navigate(['/dashboard/tournaments']);
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Une erreur est survenue.', 'Erreur');
        },
      });
  }
}
