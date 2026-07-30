import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { BracketService } from '../../../core/services/bracket.service';
import { TournamentFormat } from '../../../core/models/bracket.model';
import { TournamentDetail } from '../../../core/models/tournament.model';
import { Team } from '../../../core/models/team.model';
import { Match } from '../../../core/models/match.model';
import { ToastService } from '../../../core/services/toast.service';
import { FormatPicker } from '../../../shared/ui/format-picker/format-picker';
import { BracketTree } from '../../../shared/ui/bracket-tree/bracket-tree';
import { GroupStandings, StandingsGroup } from '../../../shared/ui/group-standings/group-standings';
import { RoundPlanning } from '../../../shared/ui/round-planning/round-planning';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { computeStandings, Standing } from '../../../shared/utils/standings';
import { TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { LucideTrophy } from '@lucide/angular';
import { SportIcon } from '../../../shared/ui/sport-icon/sport-icon';
import { ShareModal } from '../../../shared/ui/share-modal/share-modal';
import { RefereeCodeModal } from '../../../shared/ui/referee-code-modal/referee-code-modal';

const GROUP_PHASE_PREFIX = 'Groupe ';

/** Order-independent key so a match can be looked up by either (home, away) or (away, home). */
function teamPairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-tournament-detail-page',
  standalone: true,
  imports: [RouterLink, FormatPicker, BracketTree, GroupStandings, RoundPlanning, FormInput, StatusBadge, LucideTrophy, SportIcon, ShareModal, RefereeCodeModal],
  templateUrl: './tournament-detail.html',
})
export class DashboardTournamentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
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
  readonly refereeCodeOpen = signal(false);

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

  /** Round-by-round planning for a pure round-robin pool ("who plays who, and who rests, each
   *  round") — for GROUP_KNOCKOUT this reuses groupPhases() directly since each group is its own
   *  pool already. */
  readonly roundPlanningGroups = computed<StandingsGroup[]>(() => {
    const t = this.tournament();
    if (!t || t.format !== 'ROUND_ROBIN') return [];
    return [{ label: 'Poule unique', teams: t.teams, matches: t.matches }];
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

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
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
      error: (err: HttpErrorResponse) => {
        this.generating.set(false);
        const message = (err.error as { message?: string } | null)?.message;
        this.toast.error(message ?? 'Une erreur est survenue lors de la génération.', 'Erreur');
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
      error: (err: HttpErrorResponse) => {
        this.advancing.set(false);
        const message = (err.error as { message?: string } | null)?.message;
        this.toast.error(message ?? "Le tour en cours n'est pas terminé ou une erreur est survenue.", 'Erreur');
      },
    });
  }

  /** Built once per tournament() change instead of scanned per grid cell — the round-robin
   *  results grid calls matchBetween() for every (row, col) pair, which was an O(n²) linear
   *  scan of all matches for an n×n team grid. */
  private readonly matchByTeamPair = computed<Map<string, Match>>(() => {
    const map = new Map<string, Match>();
    for (const m of this.tournament()?.matches ?? []) {
      map.set(teamPairKey(m.homeTeam.id, m.awayTeam.id), m);
    }
    return map;
  });

  /** The match connecting two teams, regardless of which one is stored as home/away. */
  matchBetween(a: Team, b: Team): Match | undefined {
    return this.matchByTeamPair().get(teamPairKey(a.id, b.id));
  }

  scoreFor(match: Match, team: Team): number | null {
    return match.homeTeam.id === team.id ? match.homeScore : match.awayScore;
  }
}
