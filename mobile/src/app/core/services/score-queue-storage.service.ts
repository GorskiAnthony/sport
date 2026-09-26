import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { TeamSide } from '../models/match.model';

const QUEUE_KEY = 'pendingScoreActions';

export interface PendingScoreAction {
  id: string;
  matchId: number;
  team: TeamSide;
  delta: number;
}

/** Thin wrapper around Capacitor Preferences, isolated behind DI for the same reason as
 *  TokenStorageService (voir core/auth/token-storage.service.ts) — @capacitor/preferences
 *  exports a registerPlugin() proxy that jasmine's spyOn() can't reliably intercept. */
@Injectable({ providedIn: 'root' })
export class ScoreQueueStorageService {
  async getAll(): Promise<PendingScoreAction[]> {
    const { value } = await Preferences.get({ key: QUEUE_KEY });
    if (!value) return [];
    try {
      return JSON.parse(value) as PendingScoreAction[];
    } catch {
      return [];
    }
  }

  async setAll(actions: PendingScoreAction[]): Promise<void> {
    await Preferences.set({ key: QUEUE_KEY, value: JSON.stringify(actions) });
  }
}
