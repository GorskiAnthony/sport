import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TeamService } from '../../../core/services/team.service';
import { Team } from '../../../core/models/team.model';

@Component({
  selector: 'app-spectator-favorites-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './favorites.html',
})
export class SpectatorFavoritesPage implements OnInit {
  private readonly teamService = inject(TeamService);

  readonly teams = signal<Team[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.teamService.getFollowed().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  unfollow(team: Team): void {
    this.teamService.unfollow(team.id).subscribe({
      next: () => this.teams.update((list) => list.filter((t) => t.id !== team.id)),
    });
  }
}
