import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TeamService } from '../../../core/services/team.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { Team } from '../../../core/models/team.model';
import { TournamentSummary } from '../../../core/models/tournament.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModal } from '../../../shared/ui/confirm-modal/confirm-modal';

interface TeamForm {
  name: string;
  category: string;
  contact: string;
  logo: string;
}

const EMPTY_FORM: TeamForm = { name: '', category: 'U15', contact: '', logo: '' };
const CATEGORIES = ['U13', 'U15', 'U16', 'U17', 'U18', 'Senior'];
const CAT_STYLES: Record<string, string> = {
  U13: 'bg-pink-500/20 text-pink-400',
  U15: 'bg-green-500/20 text-green-400',
  U16: 'bg-amber-500/20 text-amber-400',
  U17: 'bg-blue-500/20 text-blue-400',
  U18: 'bg-purple-500/20 text-purple-400',
  Senior: 'bg-slate-500/20 text-slate-300',
};

@Component({
  selector: 'app-dashboard-teams-page',
  standalone: true,
  imports: [ConfirmModal],
  templateUrl: './teams.html',
})
export class DashboardTeamsPage implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly tournamentService = inject(TournamentService);
  private readonly toast = inject(ToastService);

  readonly categories = CATEGORIES;
  readonly catStyles = CAT_STYLES;

  readonly tournaments = signal<TournamentSummary[]>([]);
  readonly selectedTournamentId = signal<number | null>(null);
  readonly teams = signal<Team[]>([]);
  readonly loading = signal(true);
  readonly skeletons = [1, 2, 3];

  readonly form = signal<TeamForm>(EMPTY_FORM);
  readonly editId = signal<number | null>(null);
  readonly panelOpen = signal(false);
  readonly pending = signal<Team | null>(null);

  ngOnInit(): void {
    this.tournamentService.getMine().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        if (tournaments.length > 0) {
          this.selectedTournamentId.set(tournaments[0].id);
          this.loadTeams(tournaments[0].id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private loadTeams(tournamentId: number): void {
    this.loading.set(true);
    this.teamService.getByTournament(tournamentId).subscribe({
      next: (teams) => {
        this.teams.set(teams);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onTournamentChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.selectedTournamentId.set(id);
    this.loadTeams(id);
  }

  openAdd(): void {
    this.editId.set(null);
    this.form.set(EMPTY_FORM);
    this.panelOpen.set(true);
  }

  openEdit(team: Team): void {
    this.editId.set(team.id);
    this.form.set({ name: team.name, category: team.category, contact: team.contact ?? '', logo: team.logo ?? '' });
    this.panelOpen.set(true);
  }

  updateField<K extends keyof TeamForm>(field: K, value: TeamForm[K]): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => this.updateField('logo', (ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  }

  save(): void {
    const tournamentId = this.selectedTournamentId();
    const form = this.form();
    if (!form.name.trim()) {
      this.toast.error('Le nom est requis.');
      return;
    }
    if (!tournamentId) return;

    const editId = this.editId();
    if (editId !== null) {
      this.teamService.update(editId, form).subscribe({
        next: (updated) => {
          this.teams.update((list) => list.map((t) => (t.id === editId ? updated : t)));
          this.toast.success(`${form.name} mis à jour.`);
          this.panelOpen.set(false);
        },
        error: () => this.toast.error('Une erreur est survenue.'),
      });
    } else {
      this.teamService.create({ ...form, tournamentId }).subscribe({
        next: (created) => {
          this.teams.update((list) => [...list, created]);
          this.toast.success(`${form.name} ajoutée.`, 'Équipe ajoutée');
          this.panelOpen.set(false);
        },
        error: (err: HttpErrorResponse) => {
          const message = (err.error as { message?: string } | null)?.message;
          this.toast.error(message ?? 'Une erreur est survenue.');
        },
      });
    }
  }

  confirmDelete(): void {
    const target = this.pending();
    if (!target) return;
    this.teamService.delete(target.id).subscribe({
      next: () => {
        this.teams.update((list) => list.filter((t) => t.id !== target.id));
        this.toast.success(`${target.name} supprimée.`);
        this.pending.set(null);
      },
      error: () => {
        this.toast.error('Une erreur est survenue.');
        this.pending.set(null);
      },
    });
  }
}
