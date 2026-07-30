import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TeamService } from '../../../core/services/team.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { Team } from '../../../core/models/team.model';
import { TournamentSummary } from '../../../core/models/tournament.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModal } from '../../../shared/ui/confirm-modal/confirm-modal';

interface ImportedRow {
  name: string;
  category: string;
  contact: string;
}

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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly importing = signal(false);

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

  /** CSV/Excel bulk import — most organizers already keep their team list in a spreadsheet,
   *  and typing them one by one becomes painful once a tournament has dozens of teams (up to
   *  128 per bracket now). Accepts "Nom,Catégorie,Contact" per line, with an optional header
   *  row and either comma or semicolon as separator (French Excel exports use ";" by default
   *  since "," is the decimal separator). */
  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file if the organizer fixes and retries
    if (!file) return;

    const tournamentId = this.selectedTournamentId();
    if (!tournamentId) return;

    const reader = new FileReader();
    reader.onload = () => {
      const rows = this.parseCsv(String(reader.result ?? ''));
      if (rows.length === 0) {
        this.toast.error("Aucune équipe reconnue dans le fichier. Format attendu : Nom,Catégorie,Contact.");
        return;
      }
      this.importRows(tournamentId, rows);
    };
    reader.readAsText(file);
  }

  private parseCsv(text: string): ImportedRow[] {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length === 0) return [];

    const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';
    const splitLine = (line: string): string[] =>
      line.split(delimiter).map((cell) => cell.trim().replace(/^"(.*)"$/, '$1'));

    const firstCell = splitLine(lines[0])[0]?.toLowerCase();
    const dataLines = ['nom', 'name', 'équipe', 'equipe'].includes(firstCell) ? lines.slice(1) : lines;

    return dataLines
      .map((line) => {
        const [name, category, contact] = splitLine(line);
        return { name: name ?? '', category: category?.toUpperCase() || 'U15', contact: contact ?? '' };
      })
      .filter((row) => row.name.length > 0);
  }

  private importRows(tournamentId: number, rows: ImportedRow[]): void {
    this.importing.set(true);
    forkJoin(
      rows.map((row) =>
        this.teamService.create({ ...row, tournamentId }).pipe(
          map((team) => ({ ok: true as const, team })),
          catchError(() => of({ ok: false as const, team: null })),
        ),
      ),
    ).subscribe((results) => {
      this.importing.set(false);
      const created = results.filter((r): r is { ok: true; team: Team } => r.ok).map((r) => r.team);
      const failedCount = results.length - created.length;

      if (created.length > 0) {
        this.teams.update((list) => [...list, ...created]);
      }
      if (failedCount === 0) {
        this.toast.success(`${created.length} équipe(s) importée(s).`, 'Import réussi');
      } else if (created.length === 0) {
        this.toast.error("Aucune équipe n'a pu être importée (limite de votre plan atteinte ?).");
      } else {
        this.toast.info(`${created.length} équipe(s) importée(s), ${failedCount} en échec (limite de votre plan ?).`, 'Import partiel');
      }
    });
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
