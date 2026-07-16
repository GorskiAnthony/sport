import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toDataURL } from 'qrcode';
import { TournamentService } from '../../../core/services/tournament.service';
import { MatchService } from '../../../core/services/match.service';
import { BracketService } from '../../../core/services/bracket.service';
import { TournamentFormat } from '../../../core/models/bracket.model';
import { TournamentDetail } from '../../../core/models/tournament.model';
import { Team } from '../../../core/models/team.model';
import { Match } from '../../../core/models/match.model';
import { ToastService } from '../../../core/services/toast.service';
import { FormatPicker } from '../../../shared/ui/format-picker/format-picker';
import { BracketTree } from '../../../shared/ui/bracket-tree/bracket-tree';
import { GroupStandings, StandingsGroup } from '../../../shared/ui/group-standings/group-standings';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { computeStandings, Standing } from '../../../shared/utils/standings';
import { SPORT_ICONS, TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';
import { tournamentShareSlug } from '../../../shared/utils/slug';

const GROUP_PHASE_PREFIX = 'Groupe ';

@Component({
  selector: 'app-dashboard-tournament-detail-page',
  standalone: true,
  imports: [RouterLink, FormatPicker, BracketTree, GroupStandings, FormInput],
  templateUrl: './tournament-detail.html',
})
export class DashboardTournamentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly matchService = inject(MatchService);
  private readonly bracketService = inject(BracketService);
  private readonly toast = inject(ToastService);

  private readonly tournamentId = Number(this.route.snapshot.paramMap.get('id'));

  readonly tournament = signal<TournamentDetail | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly chosenFormat = signal<TournamentFormat | null>(null);
  readonly groupCount = signal('4');
  readonly generating = signal(false);
  readonly advancing = signal(false);

  readonly shareOpen = signal(false);
  readonly qrDataUrl = signal<string | null>(null);

  /** Identifies the exact grid cell (row team id, col team id) being edited — not just the
   *  match id, since round robin shows each match twice (mirrored), and only the clicked
   *  cell should switch to edit mode, not its mirror. */
  readonly editingCell = signal<{ rowTeamId: number; colTeamId: number } | null>(null);
  readonly homeInput = signal('');
  readonly awayInput = signal('');
  readonly savingScore = signal(false);

  readonly standings = computed<Standing[]>(() => {
    const t = this.tournament();
    return t ? computeStandings(t) : [];
  });

  readonly knockoutMatches = computed<Match[]>(() =>
    (this.tournament()?.matches ?? []).filter((m) => !m.phase?.startsWith(GROUP_PHASE_PREFIX)),
  );

  readonly groupPhases = computed<StandingsGroup[]>(() => {
    const t = this.tournament();
    if (!t) return [];
    const byPhase = new Map<string, Match[]>();
    const order: string[] = [];
    for (const match of [...t.matches].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.id - b.id)) {
      const phase = match.phase ?? '';
      if (!phase.startsWith(GROUP_PHASE_PREFIX)) continue;
      if (!byPhase.has(phase)) {
        byPhase.set(phase, []);
        order.push(phase);
      }
      byPhase.get(phase)!.push(match);
    }
    return order.map((label) => {
      const matches = byPhase.get(label)!;
      const teamIds = new Set<number>();
      matches.forEach((m) => { teamIds.add(m.homeTeam.id); teamIds.add(m.awayTeam.id); });
      const teams = t.teams.filter((team) => teamIds.has(team.id));
      return { label, teams, matches };
    });
  });

  /** Only teams that appear in a knockout-phase match — never the full tournament team list.
   *  bracket-tree.ts treats any team in its [teams] input that's absent from round-1 matches as
   *  a "bye", so feeding it group-stage-eliminated teams would render them as false byes. */
  readonly qualifiedTeams = computed<Team[]>(() => {
    const t = this.tournament();
    if (!t) return [];
    const ids = new Set<number>();
    this.knockoutMatches().forEach((m) => { ids.add(m.homeTeam.id); ids.add(m.awayTeam.id); });
    return t.teams.filter((team) => ids.has(team.id));
  });

  ngOnInit(): void {
    if (!this.tournamentId) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.load();
  }

  load(): void {
    this.tournamentService.getById(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  icon(sport: string): string {
    return SPORT_ICONS[sport] ?? '🏆';
  }

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
  }

  shareUrl(): string {
    const name = this.tournament()?.name ?? '';
    return `${window.location.origin}/t/${tournamentShareSlug(this.tournamentId, name)}`;
  }

  openShare(): void {
    this.shareOpen.set(true);
    this.qrDataUrl.set(null);
    toDataURL(this.shareUrl(), { margin: 1, width: 240 })
      .then((dataUrl) => this.qrDataUrl.set(dataUrl))
      .catch(() => this.qrDataUrl.set(null));
  }

  copyShareLink(): void {
    navigator.clipboard.writeText(this.shareUrl()).then(() => this.toast.success('Lien copié dans le presse-papiers.'));
  }

  generateBracket(): void {
    const format = this.chosenFormat();
    if (!format) {
      this.toast.error('Choisissez un format.');
      return;
    }

    const groupCount = format === 'GROUP_KNOCKOUT' ? Number(this.groupCount()) : undefined;
    this.generating.set(true);
    this.bracketService.generate(this.tournamentId, format, groupCount).subscribe({
      next: () => {
        this.generating.set(false);
        this.toast.success('Le tableau a été généré.', 'Tableau généré');
        this.load();
      },
      error: () => {
        this.generating.set(false);
        this.toast.error('Une erreur est survenue lors de la génération.', 'Erreur');
      },
    });
  }

  advanceRound(): void {
    this.advancing.set(true);
    this.bracketService.advance(this.tournamentId).subscribe({
      next: (result) => {
        this.advancing.set(false);
        if (result.tournamentComplete) {
          this.toast.success(`🏆 Champion : ${result.champion?.name ?? '—'}`, 'Tournoi terminé');
        } else {
          this.toast.success('Le tour suivant a été généré.', 'Tour suivant');
        }
        this.load();
      },
      error: () => {
        this.advancing.set(false);
        this.toast.error("Le tour en cours n'est pas terminé ou une erreur est survenue.", 'Erreur');
      },
    });
  }

  cancelEdit(): void {
    this.editingCell.set(null);
  }

  startMatch(match: Match): void {
    this.matchService.start(match.id).subscribe({
      next: () => {
        this.toast.success(`${match.homeTeam.name} vs ${match.awayTeam.name} a commencé.`);
        this.load();
      },
      error: () => this.toast.error('Une erreur est survenue.'),
    });
  }

  addGoal(match: Match, team: Team): void {
    this.matchService.addGoal(match.id, team.id).subscribe({
      next: () => this.toast.success(`But de ${team.name} enregistré.`),
      error: () => this.toast.error('Une erreur est survenue.'),
    });
  }

  isEditingCell(rowTeam: Team, colTeam: Team): boolean {
    const cell = this.editingCell();
    return cell !== null && cell.rowTeamId === rowTeam.id && cell.colTeamId === colTeam.id;
  }

  /** The match connecting two teams, regardless of which one is stored as home/away. */
  matchBetween(a: Team, b: Team): Match | undefined {
    return this.tournament()?.matches.find(
      (m) => (m.homeTeam.id === a.id && m.awayTeam.id === b.id) || (m.homeTeam.id === b.id && m.awayTeam.id === a.id),
    );
  }

  scoreFor(match: Match, team: Team): number | null {
    return match.homeTeam.id === team.id ? match.homeScore : match.awayScore;
  }

  startGridEdit(match: Match, rowTeam: Team, colTeam: Team): void {
    const rowIsHome = match.homeTeam.id === rowTeam.id;
    this.editingCell.set({ rowTeamId: rowTeam.id, colTeamId: colTeam.id });
    this.homeInput.set(this.scoreOrEmpty(rowIsHome ? match.homeScore : match.awayScore));
    this.awayInput.set(this.scoreOrEmpty(rowIsHome ? match.awayScore : match.homeScore));
  }

  saveGridScore(match: Match, rowTeam: Team): void {
    const rowScore = Number(this.homeInput());
    const colScore = Number(this.awayInput());
    if (Number.isNaN(rowScore) || Number.isNaN(colScore) || rowScore < 0 || colScore < 0) {
      this.toast.error('Merci de saisir un score valide.');
      return;
    }

    const rowIsHome = match.homeTeam.id === rowTeam.id;
    const homeScore = rowIsHome ? rowScore : colScore;
    const awayScore = rowIsHome ? colScore : rowScore;

    this.savingScore.set(true);
    this.matchService.updateScore(match.id, { homeScore, awayScore }).subscribe({
      next: () => {
        this.savingScore.set(false);
        this.editingCell.set(null);
        this.load();
      },
      error: () => {
        this.savingScore.set(false);
        this.toast.error('Une erreur est survenue.');
      },
    });
  }

  private scoreOrEmpty(score: number | null): string {
    return score !== null ? String(score) : '';
  }
}
