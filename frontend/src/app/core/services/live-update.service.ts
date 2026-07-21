import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

function toWebSocketUrl(apiUrl: string): string {
  if (apiUrl.startsWith('http')) {
    return apiUrl.replace(/^http/, 'ws') + '/ws';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${apiUrl}/ws`;
}

@Injectable({ providedIn: 'root' })
export class LiveUpdateService {
  /** Subscribes to live updates for a tournament; call the returned function to unsubscribe. */
  subscribeToTournament(tournamentId: number, onUpdate: () => void): () => void {
    const client = new Client({
      brokerURL: toWebSocketUrl(environment.apiUrl),
      reconnectDelay: 3000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/tournaments/${tournamentId}`, () => onUpdate());
    };
    client.activate();

    return () => client.deactivate();
  }

  /** Subscribes to a signed-in spectator's personal notification stream (team-follow events);
   *  call the returned function to unsubscribe. The backend only allows subscribing to your own
   *  channel — the token authenticates the STOMP session so it can check that. */
  subscribeToUserNotifications(
    userId: number,
    token: string,
    onNotification: (notification: Notification) => void,
  ): () => void {
    const client = new Client({
      brokerURL: toWebSocketUrl(environment.apiUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/notifications/${userId}`, (message: IMessage) => {
        onNotification(JSON.parse(message.body));
      });
    };
    client.activate();

    return () => client.deactivate();
  }
}
