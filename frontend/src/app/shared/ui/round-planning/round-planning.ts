import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StandingsGroup } from '../group-standings/group-standings';
import { Team } from '../../../core/models/team.model';
import { Round, groupMatchesIntoRounds } from '../../utils/rounds';

interface PlanningGroup {
  label: string;
  rounds: Round[];
}

@Component({
  selector: 'app-round-planning',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './round-planning.html',
})
export class RoundPlanning {
  readonly groups = input.required<StandingsGroup[]>();

  readonly planning = computed<PlanningGroup[]>(() =>
    this.groups().map((group) => ({
      label: group.label,
      rounds: groupMatchesIntoRounds(group.matches, group.teams),
    })),
  );

  restingLabel(teams: Team[]): string {
    return teams.map((team) => team.name).join(', ');
  }
}
