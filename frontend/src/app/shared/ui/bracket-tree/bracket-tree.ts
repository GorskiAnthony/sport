import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Match } from '../../../core/models/match.model';
import { Team } from '../../../core/models/team.model';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bracket-tree',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bracket-tree.html',
})
export class BracketTree {
  readonly teams = input.required<Team[]>();
  readonly matches = input.required<Match[]>();

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

  isForfeited(match: Match, teamId: number): boolean {
    return match.status === 'FORFEIT' && match.forfeitedTeamId === teamId;
  }

  winnerTeamId(match: Match): number | null {
    if (match.status === 'FORFEIT') {
      return match.forfeitedTeamId === match.homeTeam.id ? match.awayTeam.id : match.homeTeam.id;
    }
    if (match.homeScore === null || match.awayScore === null || match.homeScore === match.awayScore) return null;
    return match.homeScore > match.awayScore ? match.homeTeam.id : match.awayTeam.id;
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
