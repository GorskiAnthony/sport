import { Component, input } from '@angular/core';
import { Match } from '../../../core/models/match.model';
import { Team } from '../../../core/models/team.model';
import { computeStandings, Standing } from '../../utils/standings';

export interface StandingsGroup {
  label: string;
  teams: Team[];
  matches: Match[];
}

@Component({
  selector: 'app-group-standings',
  standalone: true,
  templateUrl: './group-standings.html',
})
export class GroupStandings {
  readonly groups = input.required<StandingsGroup[]>();

  standingsFor(group: StandingsGroup): Standing[] {
    return computeStandings(group);
  }
}
