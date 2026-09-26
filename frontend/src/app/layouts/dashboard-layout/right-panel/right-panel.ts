import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStatsService } from '../../../core/services/dashboard-stats.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TeamService } from '../../../core/services/team.service';
import { Match } from '../../../core/models/match.model';
import { Notification } from '../../../core/models/notification.model';
import { FollowedTeam } from '../../../core/models/team.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-right-panel',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './right-panel.html',
})
export class DashboardRightPanel implements OnInit {
  private readonly statsService = inject(DashboardStatsService);
  private readonly notificationService = inject(NotificationService);
  private readonly teamService = inject(TeamService);

  readonly unreadCount = this.notificationService.unreadCount;

  readonly upcomingMatches = signal<Match[]>([]);
  readonly loadingMatches = signal(true);

  readonly notifications = signal<Notification[]>([]);
  readonly loadingNotifications = signal(true);

  readonly followedTeams = signal<FollowedTeam[]>([]);
  readonly loadingFollowed = signal(true);

  ngOnInit(): void {
    this.statsService.getOrganizerStats().subscribe({
      next: (stats) => {
        this.upcomingMatches.set(stats.upcomingMatches.slice(0, 5));
        this.loadingMatches.set(false);
      },
      error: () => this.loadingMatches.set(false),
    });

    this.notificationService.getMine().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications.slice(0, 5));
        this.loadingNotifications.set(false);
      },
      error: () => this.loadingNotifications.set(false),
    });

    this.teamService.getFollowedEnriched().subscribe({
      next: (teams) => {
        this.followedTeams.set(teams.slice(0, 5));
        this.loadingFollowed.set(false);
      },
      error: () => this.loadingFollowed.set(false),
    });
  }

  markRead(notification: Notification): void {
    if (notification.read) return;
    this.notificationService.markRead(notification.id).subscribe({
      next: () =>
        this.notifications.update((list) =>
          list.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
        ),
    });
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => this.notifications.update((list) => list.map((n) => ({ ...n, read: true }))),
    });
  }
}
