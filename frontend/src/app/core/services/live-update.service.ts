import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';

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
}
