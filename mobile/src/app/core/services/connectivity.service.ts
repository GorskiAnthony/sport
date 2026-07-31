import { Injectable, signal } from '@angular/core';
import { Network } from '@capacitor/network';

/** État réseau global de l'app — sert au mode hors-ligne de l'écran arbitre (voir
 *  ScoreQueueService) pour savoir quand mettre les scores en file plutôt que les envoyer, et
 *  quand relancer la synchro. init() doit tourner avant le premier rendu (voir main.ts,
 *  provideAppInitializer), même raison que AuthService.restoreSession(). */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly onlineSignal = signal(true);

  readonly online = this.onlineSignal.asReadonly();

  async init(): Promise<void> {
    const status = await Network.getStatus();
    this.onlineSignal.set(status.connected);

    await Network.addListener('networkStatusChange', (status) => {
      this.onlineSignal.set(status.connected);
    });
  }
}
