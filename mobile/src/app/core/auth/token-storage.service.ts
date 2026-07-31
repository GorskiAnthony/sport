import { Injectable } from '@angular/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/** Thin wrapper around capacitor-secure-storage-plugin, isolated behind DI so AuthService's
 *  tests can mock it directly — Capacitor plugins export a registerPlugin() proxy, and
 *  jasmine's spyOn() can't reliably intercept calls made through that proxy from other
 *  modules.
 *
 *  Le JWT et l'utilisateur courant sont des données sensibles (OWASP MASVS-STORAGE) : à la
 *  différence de @capacitor/preferences (SharedPreferences/UserDefaults en clair), ce plugin
 *  chiffre via l'Android Keystore / le Keychain iOS. get() lève une erreur (au lieu de
 *  renvoyer une valeur vide) quand la clé est absente — d'où les try/catch ci-dessous pour
 *  retomber sur `null`, cohérent avec l'ancienne API. */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  async getToken(): Promise<string | null> {
    return this.getOrNull(TOKEN_KEY);
  }

  async getUser(): Promise<string | null> {
    return this.getOrNull(USER_KEY);
  }

  async setSession(token: string, userJson: string): Promise<void> {
    await Promise.all([
      SecureStoragePlugin.set({ key: TOKEN_KEY, value: token }),
      SecureStoragePlugin.set({ key: USER_KEY, value: userJson }),
    ]);
  }

  async clear(): Promise<void> {
    await Promise.all([this.removeIfPresent(TOKEN_KEY), this.removeIfPresent(USER_KEY)]);
  }

  async removeUser(): Promise<void> {
    await this.removeIfPresent(USER_KEY);
  }

  private async getOrNull(key: string): Promise<string | null> {
    try {
      const { value } = await SecureStoragePlugin.get({ key });
      return value;
    } catch {
      return null;
    }
  }

  private async removeIfPresent(key: string): Promise<void> {
    try {
      await SecureStoragePlugin.remove({ key });
    } catch {
      // Déjà absent — rien à faire.
    }
  }
}
