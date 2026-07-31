import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Le plugin a une implémentation web (Vibration API) — pas besoin de garder Capacitor.isNativePlatform(),
// contrairement à StatusBar dans app.component.ts qui n'a pas d'équivalent web.
export function hapticTap(): void {
  void Haptics.impact({ style: ImpactStyle.Light });
}

export function hapticSelection(): void {
  void Haptics.selectionChanged();
}

export function hapticSuccess(): void {
  void Haptics.notification({ type: NotificationType.Success });
}
