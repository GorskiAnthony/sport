import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification, NotificationType } from '../../../core/models/notification.model';

const TYPE_ICONS: Record<NotificationType, string> = {
  MATCH_STARTED: '▶️',
  MATCH_FINISHED: '🏁',
  GOAL_SCORED: '⚽',
};

@Component({
  selector: 'app-spectator-notifications-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './notifications.html',
})
export class SpectatorNotificationsPage implements OnInit {
  private readonly notificationService = inject(NotificationService);

  readonly notifications = signal<Notification[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.notificationService.getMine().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  icon(type: NotificationType): string {
    return TYPE_ICONS[type] ?? '🔔';
  }

  markRead(notification: Notification): void {
    if (notification.read) return;
    this.notificationService.markRead(notification.id).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
        );
      },
    });
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => this.notifications.update((list) => list.map((n) => ({ ...n, read: true }))),
    });
  }
}
