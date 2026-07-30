import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/** Thin wrapper around Capacitor Preferences, isolated behind DI so AuthService's tests can
 *  mock it directly — @capacitor/preferences exports a registerPlugin() proxy, and jasmine's
 *  spyOn() can't reliably intercept calls made through that proxy from other modules. */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  }

  async getUser(): Promise<string | null> {
    const { value } = await Preferences.get({ key: USER_KEY });
    return value;
  }

  async setSession(token: string, userJson: string): Promise<void> {
    await Promise.all([
      Preferences.set({ key: TOKEN_KEY, value: token }),
      Preferences.set({ key: USER_KEY, value: userJson }),
    ]);
  }

  async clear(): Promise<void> {
    await Promise.all([Preferences.remove({ key: TOKEN_KEY }), Preferences.remove({ key: USER_KEY })]);
  }

  async removeUser(): Promise<void> {
    await Preferences.remove({ key: USER_KEY });
  }
}
