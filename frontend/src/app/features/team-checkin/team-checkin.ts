import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TournamentService } from '../../core/services/tournament.service';
import { TeamService } from '../../core/services/team.service';
import { TournamentDetail } from '../../core/models/tournament.model';
import { Team } from '../../core/models/team.model';
import { SportIcon } from '../../shared/ui/sport-icon/sport-icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-team-checkin-page',
  standalone: true,
  imports: [RouterLink, DatePipe, SportIcon],
  templateUrl: './team-checkin.html',
})
export class TeamCheckinPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly teamService = inject(TeamService);

  readonly tournament = signal<TournamentDetail | null>(null);
  readonly teams = signal<Team[]>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly checkingInId = signal<number | null>(null);

  readonly checkedInCount = computed(() => this.teams().filter((t) => t.checkedInAt).length);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }

    this.tournamentService.getById(id).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.teams.set([...tournament.teams].sort((a, b) => a.name.localeCompare(b.name)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  checkIn(team: Team): void {
    if (team.checkedInAt || this.checkingInId()) return;
    this.checkingInId.set(team.id);
    this.teamService.checkIn(team.id).subscribe({
      next: (updated) => {
        this.checkingInId.set(null);
        this.teams.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
      },
      error: () => this.checkingInId.set(null),
    });
  }
}
