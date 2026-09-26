import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { TeamService } from '../../../core/services/team.service';
import { BracketService } from '../../../core/services/bracket.service';
import { EventPassService } from '../../../core/services/event-pass.service';
import { TournamentFormat } from '../../../core/models/bracket.model';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Button } from '../../../shared/ui/button/button';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { FormSelect, FormSelectOption } from '../../../shared/ui/form-select/form-select';
import { FormatPicker } from '../../../shared/ui/format-picker/format-picker';
import { ConfirmModal } from '../../../shared/ui/confirm-modal/confirm-modal';
import { todayIsoDate } from '../../../shared/utils/today';
import { SPORTS as SPORT_LIST } from '../../../shared/utils/sports';
import { LucideLock } from '@lucide/angular';

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

const MAX_TOURNAMENTS_BY_PLAN: Record<string, number> = {
  FREE: 1,
  CLASSIC: Infinity,
  PRO: Infinity,
};

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

const TEAM_CATEGORIES = ['U13', 'U15', 'U16', 'U17', 'U18', 'Senior'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-new-tournament-page',
  standalone: true,
  imports: [RouterLink, Button, FormInput, FormSelect, FormatPicker, ConfirmModal, LucideLock],
  templateUrl: './new-tournament.html',
})
export class DashboardNewTournamentPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly teamService = inject(TeamService);
  private readonly bracketService = inject(BracketService);
  private readonly authService = inject(AuthService);
  private readonly eventPassService = inject(EventPassService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly sports = SPORTS;
  readonly categories = CATEGORIES;
  readonly teamCategories = TEAM_CATEGORIES;

  readonly step = signal<1 | 2>(1);
  readonly planBlocked = signal(false);
  readonly cancelOpen = signal(false);
  readonly createdTournamentId = signal<number | null>(null);
  readonly finishing = signal(false);
  readonly useEventPass = signal(false);
  readonly confirmingEventPass = signal(false);
  readonly eventPassConfirmFailed = signal(false);

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
  readonly teams = signal<TeamRow[]>([]);

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('eventPass') === '1') {
      this.confirmEventPass();
      return;
    }

    const plan = this.authService.currentUser()?.plan ?? 'FREE';
    const limit = MAX_TOURNAMENTS_BY_PLAN[plan] ?? 1;
    this.tournamentService.getMine().subscribe((tournaments) => {
      if (tournaments.length >= limit) {
        this.planBlocked.set(true);
      }
    });
  }

  private confirmEventPass(attempt = 0): void {
    this.confirmingEventPass.set(true);
    this.eventPassConfirmFailed.set(false);
    this.eventPassService.credits().subscribe({
      next: (res) => {
        if (res.available) {
          this.useEventPass.set(true);
          this.confirmingEventPass.set(false);
          return;
        }
        if (attempt >= 9) {
          this.confirmingEventPass.set(false);
          this.eventPassConfirmFailed.set(true);
          return;
        }
        setTimeout(() => this.confirmEventPass(attempt + 1), 1500);
      },
      error: () => {
        this.confirmingEventPass.set(false);
        this.eventPassConfirmFailed.set(true);
      },
    });
  }

  retryEventPassConfirmation(): void {
    this.confirmEventPass();
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

    this.loading.set(true);
    this.tournamentService
      .create({
        name: this.name(),
        sport: this.sport(),
        category: this.category(),
        location: this.location(),
        startDate: this.startDate(),
        endDate: this.endDate(),
        maxTeams: Number(this.maxTeams()) || 14,
        description: this.description() || undefined,
        useEventPass: this.useEventPass() || undefined,
      })
      .subscribe({
        next: (created) => {
          this.createdTournamentId.set(created.id);
          this.loading.set(false);
          this.step.set(2);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          const message = (err.error as { message?: string } | null)?.message;
          this.toast.error(message ?? 'Erreur lors de la création.');
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
    const format = this.format();
    if (!tournamentId || !format) return;

    const rowsToCreate = this.teams().filter((t) => t.name.trim());
    if (rowsToCreate.length === 0) {
      this.toast.info(
        'Ajoutez au moins 2 équipes pour générer le tableau automatiquement (possible depuis la liste des tournois).',
        'Tournoi créé',
      );
      this.router.navigate(['/dashboard/tournaments']);
      return;
    }

    if (format === 'GROUP_KNOCKOUT' && Math.floor(rowsToCreate.length / Number(this.groupCount())) < 3) {
      this.toast.error('Avec ce nombre de poules, certaines poules auraient moins de 3 équipes.');
      return;
    }

    this.finishing.set(true);
    forkJoin(
      rowsToCreate.map((row) =>
        this.teamService.create({ name: row.name, category: row.category, tournamentId }),
      ),
    ).subscribe({
      next: () => {
        if (rowsToCreate.length < 2) {
          this.finishing.set(false);
          this.toast.info(
            'Tournoi et équipe créés. Ajoutez au moins 2 équipes pour générer le tableau automatiquement.',
            'Tournoi créé',
          );
          this.router.navigate(['/dashboard/tournaments']);
          return;
        }

        const groupCount = format === 'GROUP_KNOCKOUT' ? Number(this.groupCount()) : undefined;
        this.bracketService.generate(tournamentId, format, groupCount).subscribe({
          next: () => {
            this.finishing.set(false);
            this.toast.success('Tournoi créé et tableau généré !', 'Succès');
            this.router.navigate(['/dashboard/tournaments']);
          },
          error: (err: HttpErrorResponse) => {
            this.finishing.set(false);
            const message = (err.error as { message?: string } | null)?.message;
            this.toast.error(
              message ?? "Les équipes ont été ajoutées, mais la génération du tableau a échoué. Réessayez depuis la liste des tournois.",
            );
            this.router.navigate(['/dashboard/tournaments']);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.finishing.set(false);
        const message = (err.error as { message?: string } | null)?.message;
        this.toast.error(message ?? "Une erreur est survenue lors de l'ajout des équipes.");
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/tournaments']);
  }
}
