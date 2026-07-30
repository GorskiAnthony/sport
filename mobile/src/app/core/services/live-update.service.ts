import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';

// environment.apiUrl est toujours une URL absolue http(s) côté mobile (pas de proxy nginx
// same-origin comme en web) — pas besoin du repli sur window.location de la version web.
function toWebSocketUrl(apiUrl: string): string {
  return apiUrl.replace(/^http/, 'ws') + '/ws';
}

/** Équivalent mobile de frontend/src/app/core/services/live-update.service.ts. */
@Injectable({ providedIn: 'root' })
export class LiveUpdateService {
  /** Abonnement aux mises à jour d'un tournoi ; appeler la fonction retournée pour se désabonner. */
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
