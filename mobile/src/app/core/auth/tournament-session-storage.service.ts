import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const SESSION_KEY = 'tournamentSession';

/** Même raison que TokenStorageService : isolé derrière une injection dédiée pour que les
 *  tests puissent mocker cette classe plutôt que d'essayer de spier le proxy
 *  registerPlugin() de @capacitor/preferences. */
@Injectable({ providedIn: 'root' })
export class TournamentSessionStorageService {
  async get(): Promise<string | null> {
    const { value } = await Preferences.get({ key: SESSION_KEY });
    return value;
  }

  async set(json: string): Promise<void> {
    await Preferences.set({ key: SESSION_KEY, value: json });
  }

  async clear(): Promise<void> {
    await Preferences.remove({ key: SESSION_KEY });
  }
}
