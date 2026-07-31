import { Injectable } from '@angular/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

const SESSION_KEY = 'tournamentSession';

/** Même raison que TokenStorageService, et même bascule vers un stockage chiffré : le token de
 *  session arbitre (obtenu via QR code) donne accès aux matchs d'un tournoi au même titre qu'un
 *  JWT organisateur — voir le commentaire détaillé dans token-storage.service.ts. */
@Injectable({ providedIn: 'root' })
export class TournamentSessionStorageService {
  async get(): Promise<string | null> {
    try {
      const { value } = await SecureStoragePlugin.get({ key: SESSION_KEY });
      return value;
    } catch {
      return null;
    }
  }

  async set(json: string): Promise<void> {
    await SecureStoragePlugin.set({ key: SESSION_KEY, value: json });
  }

  async clear(): Promise<void> {
    try {
      await SecureStoragePlugin.remove({ key: SESSION_KEY });
    } catch {
      // Déjà absent — rien à faire.
    }
  }
}
