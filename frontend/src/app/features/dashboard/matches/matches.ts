import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchService } from '../../../core/services/match.service';
import { TeamService } from '../../../core/services/team.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { Match } from '../../../core/models/match.model';
import { Team } from '../../../core/models/team.model';
import { TournamentSummary } from '../../../core/models/tournament.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModal } from '../../../shared/ui/confirm-modal/confirm-modal';

interface MatchForm {
  homeTeamId: string;
  awayTeamId: string;
  phase: string;
  date: string;
  venue: string;
}

const EMPTY_FORM: MatchForm = { homeTeamId: '', awayTeamId: '', phase: '', date: '', venue: '' };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-matches-page',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmModal],
  templateUrl: './matches.html',
})
export class DashboardMatchesPage implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly teamService = inject(TeamService);
  private readonly tournamentService = inject(TournamentService);
  private readonly toast = inject(ToastService);

  readonly tournaments = signal<TournamentSummary[]>([]);
  readonly selectedTournamentId = signal<number | null>(null);
  readonly teams = signal<Team[]>([]);
  readonly matches = signal<Match[]>([]);
  readonly loading = signal(true);
  readonly skeletons = [1, 2, 3, 4];
  readonly pending = signal<Match | null>(null);
  readonly panelOpen = signal(false);
  readonly form = signal<MatchForm>(EMPTY_FORM);

  ngOnInit(): void {
    this.tournamentService.getMine().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        if (tournaments.length > 0) {
          this.selectedTournamentId.set(tournaments[0].id);
          this.loadForTournament(tournaments[0].id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private loadForTournament(tournamentId: number): void {
    this.loading.set(true);
    this.teamService.getByTournament(tournamentId).subscribe((teams) => this.teams.set(teams));
    this.matchService.getByTournament(tournamentId).subscribe({
      next: (matches) => {
        this.matches.set(matches);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onTournamentChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.selectedTournamentId.set(id);
    this.loadForTournament(id);
  }

  updateField<K extends keyof MatchForm>(field: K, value: MatchForm[K]): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  openAdd(): void {
    this.form.set(EMPTY_FORM);
    this.panelOpen.set(true);
  }

  save(): void {
    const tournamentId = this.selectedTournamentId();
    const form = this.form();
    if (!tournamentId || !form.homeTeamId || !form.awayTeamId || !form.phase || !form.date) {
      this.toast.error('Veuillez remplir les champs requis.');
      return;
    }
    if (form.homeTeamId === form.awayTeamId) {
      this.toast.error('Les deux équipes doivent être différentes.');
      return;
    }

    this.matchService
      .create({
        tournamentId,
        homeTeamId: Number(form.homeTeamId),
        awayTeamId: Number(form.awayTeamId),
        phase: form.phase,
        date: new Date(form.date).toISOString(),
        venue: form.venue || undefined,
      })
      .subscribe({
        next: (created) => {
          this.matches.update((list) => [...list, created]);
          this.toast.success('Match ajouté.', 'Match créé');
          this.panelOpen.set(false);
        },
        error: () => this.toast.error('Une erreur est survenue.'),
      });
  }

  confirmDelete(): void {
    const target = this.pending();
    if (!target) return;
    this.matchService.delete(target.id).subscribe({
      next: () => {
        this.matches.update((list) => list.filter((m) => m.id !== target.id));
        this.toast.success(`${target.homeTeam.name} – ${target.awayTeam.name} supprimé.`, 'Match supprimé');
        this.pending.set(null);
      },
      error: () => {
        this.toast.error('Une erreur est survenue.');
        this.pending.set(null);
      },
    });
  }
}
