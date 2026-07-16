import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  /** Shared across the app (e.g. the spectator layout's bell badge) so it stays in sync
   *  when notifications are read from any page, without a page reload. */
  readonly unreadCount = signal(0);

  getMine(): Observable<Notification[]> {
    return this.http.get<ApiResponse<Notification[]>>(this.baseUrl).pipe(map((res) => res.data));
  }

  refreshUnreadCount(): void {
    this.http
      .get<ApiResponse<{ unread: number }>>(`${this.baseUrl}/unread-count`)
      .pipe(map((res) => res.data))
      .subscribe({ next: ({ unread }) => this.unreadCount.set(unread) });
  }

  markRead(id: number): Observable<{ success: boolean }> {
    return this.http
      .patch<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/${id}/read`, {})
      .pipe(
        map((res) => res.data),
        tap(() => this.unreadCount.update((count) => Math.max(0, count - 1))),
      );
  }

  markAllRead(): Observable<{ success: boolean }> {
    return this.http
      .patch<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/read-all`, {})
      .pipe(
        map((res) => res.data),
        tap(() => this.unreadCount.set(0)),
      );
  }
}
