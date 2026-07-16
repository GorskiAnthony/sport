import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Match } from '../../../core/models/match.model';
import { Team } from '../../../core/models/team.model';
import { MatchService } from '../../../core/services/match.service';
import { ToastService } from '../../../core/services/toast.service';

interface BracketNode {
  match: Match | null;
  byeTeam: Team | null;
}

interface BracketRound {
  label: string;
  nodes: BracketNode[];
}

interface ConnectorSegment {
  topPercent: number;
  heightPercent: number;
}

@Component({
  selector: 'app-bracket-tree',
  standalone: true,
  templateUrl: './bracket-tree.html',
})
export class BracketTree {
  private readonly matchService = inject(MatchService);
  private readonly toast = inject(ToastService);

  readonly teams = input.required<Team[]>();
  readonly matches = input.required<Match[]>();
  readonly scoreUpdated = output<void>();

  readonly editingMatchId = signal<number | null>(null);
  readonly homeInput = signal('');
  readonly awayInput = signal('');
  readonly saving = signal(false);

  readonly rounds = computed<BracketRound[]>(() => this.buildRounds(this.teams(), this.matches()));

  connectorSegments(round: BracketRound): ConnectorSegment[] {
    const segments: ConnectorSegment[] = [];
    const count = round.nodes.length;
    for (let i = 0; i < count; i += 2) {
      const top = this.centerPercent(i, count);
      const bottom = this.centerPercent(i + 1, count);
      segments.push({ topPercent: top, heightPercent: bottom - top });
    }
    return segments;
  }

  nodeCenterPercent(round: BracketRound, index: number): number {
    return this.centerPercent(index, round.nodes.length);
  }

  private centerPercent(index: number, count: number): number {
    return ((2 * index + 1) / (2 * count)) * 100;
  }

  winnerTeamId(match: Match): number | null {
    if (match.homeScore === null || match.awayScore === null || match.homeScore === match.awayScore) return null;
    return match.homeScore > match.awayScore ? match.homeTeam.id : match.awayTeam.id;
  }

  startEdit(match: Match): void {
    this.editingMatchId.set(match.id);
    this.homeInput.set(match.homeScore !== null ? String(match.homeScore) : '');
    this.awayInput.set(match.awayScore !== null ? String(match.awayScore) : '');
  }

  cancelEdit(): void {
    this.editingMatchId.set(null);
  }

  startMatch(match: Match): void {
    this.matchService.start(match.id).subscribe({
      next: () => {
        this.toast.success(`${match.homeTeam.name} vs ${match.awayTeam.name} a commencé.`);
        this.scoreUpdated.emit();
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

  saveScore(match: Match): void {
    const homeScore = Number(this.homeInput());
    const awayScore = Number(this.awayInput());
    if (Number.isNaN(homeScore) || Number.isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      this.toast.error('Merci de saisir un score valide.');
      return;
    }

    this.saving.set(true);
    this.matchService.updateScore(match.id, { homeScore, awayScore }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editingMatchId.set(null);
        this.scoreUpdated.emit();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Une erreur est survenue.');
      },
    });
  }

  private buildRounds(teams: Team[], matches: Match[]): BracketRound[] {
    if (matches.length === 0) return [];

    const sorted = [...matches].sort((a, b) => {
      const dateCompare = (a.date ?? '').localeCompare(b.date ?? '');
      return dateCompare !== 0 ? dateCompare : a.id - b.id;
    });

    const phaseOrder: string[] = [];
    const byPhase = new Map<string, Match[]>();
    for (const match of sorted) {
      const phase = match.phase ?? '';
      if (!byPhase.has(phase)) {
        byPhase.set(phase, []);
        phaseOrder.push(phase);
      }
      byPhase.get(phase)!.push(match);
    }

    const round1Matches = byPhase.get(phaseOrder[0]) ?? [];
    const round1TeamIds = new Set<number>();
    round1Matches.forEach((m) => {
      round1TeamIds.add(m.homeTeam.id);
      round1TeamIds.add(m.awayTeam.id);
    });
    const byeTeams = teams.filter((t) => !round1TeamIds.has(t.id));

    let round1Nodes: BracketNode[] = [
      ...round1Matches.map((m) => ({ match: m, byeTeam: null })),
      ...byeTeams.map((t) => ({ match: null, byeTeam: t })),
    ];

    if (phaseOrder.length > 1) {
      const round2Matches = byPhase.get(phaseOrder[1]) ?? [];
      const resultTeamId = (node: BracketNode): number | null =>
        node.byeTeam ? node.byeTeam.id : this.winnerTeamId(node.match!);

      round1Nodes = round1Nodes
        .map((node) => {
          const teamId = resultTeamId(node);
          const idx = round2Matches.findIndex((m) => m.homeTeam.id === teamId || m.awayTeam.id === teamId);
          return { node, idx: idx === -1 ? Number.MAX_SAFE_INTEGER : idx };
        })
        .sort((a, b) => a.idx - b.idx)
        .map((x) => x.node);
    }

    const rounds: BracketRound[] = [{ label: phaseOrder[0], nodes: round1Nodes }];

    for (let i = 1; i < phaseOrder.length; i++) {
      const roundMatches = byPhase.get(phaseOrder[i]) ?? [];
      rounds.push({ label: phaseOrder[i], nodes: roundMatches.map((m) => ({ match: m, byeTeam: null })) });
    }

    return rounds;
  }
}
