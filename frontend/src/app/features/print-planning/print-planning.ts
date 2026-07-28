import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentDetail } from '../../core/models/tournament.model';
import { Match } from '../../core/models/match.model';
import { Team } from '../../core/models/team.model';
import { StandingsGroup } from '../../shared/ui/group-standings/group-standings';
import { Round, groupMatchesIntoRounds } from '../../shared/utils/rounds';
import { formatDateFr } from '../../shared/utils/date';

const GROUP_PHASE_PREFIX = 'Groupe ';

interface PrintGroup {
  label: string;
  rounds: Round[];
}

@Component({
  selector: 'app-print-planning-page',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './print-planning.html',
})
export class PrintPlanningPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);

  readonly tournament = signal<TournamentDetail | null>(null);
  readonly loading = signal(true);

  readonly groups = computed<PrintGroup[]>(() => {
    const t = this.tournament();
    if (!t) return [];
    return this.planningGroups(t).map((group) => ({
      label: group.label,
      rounds: groupMatchesIntoRounds(group.matches, group.teams),
    }));
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.tournamentService.getById(id).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  dateRange(t: TournamentDetail): string {
    return `${formatDateFr(t.startDate)} – ${formatDateFr(t.endDate)}`;
  }

  restingLabel(teams: Team[]): string {
    return teams.map((team) => team.name).join(', ');
  }

  print(): void {
    window.print();
  }

  private planningGroups(t: TournamentDetail): StandingsGroup[] {
    if (t.format === 'GROUP_KNOCKOUT') {
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
        matches.forEach((m) => {
          teamIds.add(m.homeTeam.id);
          teamIds.add(m.awayTeam.id);
        });
        const teams = t.teams.filter((team) => teamIds.has(team.id));
        return { label, teams, matches };
      });
    }
    if (t.format === 'ROUND_ROBIN') {
      return [{ label: 'Poule unique', teams: t.teams, matches: t.matches }];
    }
    return [];
  }
}
