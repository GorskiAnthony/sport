import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TeamService } from '../../../core/services/team.service';
import { FollowedTeam } from '../../../core/models/team.model';
import { TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';

@Component({
  selector: 'app-spectator-favorites-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './favorites.html',
})
export class SpectatorFavoritesPage implements OnInit {
  private readonly teamService = inject(TeamService);

  readonly teams = signal<FollowedTeam[]>([]);
  readonly loading = signal(true);
  readonly statusLabels = TOURNAMENT_STATUS_LABELS;

  ngOnInit(): void {
    this.teamService.getFollowedEnriched().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  unfollow(followedTeam: FollowedTeam): void {
    const teamId = followedTeam.team.id;
    this.teamService.unfollow(teamId).subscribe({
      next: () => this.teams.update((list) => list.filter((f) => f.team.id !== teamId)),
    });
  }
}
