import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecentTournament, TournamentSummary } from '../../../core/models/tournament.model';
import { SPORT_ICONS, TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';

@Component({
  selector: 'app-spectator-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './spectator-home.html',
})
export class SpectatorHomePage implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly notificationService = inject(NotificationService);

  readonly loading = signal(true);
  readonly live = signal<TournamentSummary[]>([]);
  readonly featured = signal<TournamentSummary[]>([]);
  readonly recentlyViewed = signal<RecentTournament[]>([]);
  readonly unreadCount = this.notificationService.unreadCount;

  readonly sports = [
    { id: 'football', label: 'Football', icon: '⚽' },
    { id: 'basketball', label: 'Basketball', icon: '🏀' },
    { id: 'tennis', label: 'Tennis', icon: '🎾' },
    { id: 'volleyball', label: 'Volleyball', icon: '🏐' },
    { id: 'rugby', label: 'Rugby', icon: '🏉' },
    { id: 'esport', label: 'Esport', icon: '🎮' },
  ];

  ngOnInit(): void {
    this.tournamentService.getAll().subscribe({
      next: (tournaments) => {
        this.live.set(tournaments.filter((t) => t.status === 'ONGOING').slice(0, 4));
        this.featured.set(tournaments.slice(0, 6));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.tournamentService.getRecentlyViewed().subscribe({
      next: (recent) => this.recentlyViewed.set(recent),
      error: () => {}, // non-critical section, fail silently
    });
  }

  icon(sport: string): string {
    return SPORT_ICONS[sport] ?? '🏆';
  }

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
  }
}
