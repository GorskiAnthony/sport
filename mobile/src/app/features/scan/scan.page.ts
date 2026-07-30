import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, flashOutline, flashOffOutline, closeOutline, settingsOutline } from 'ionicons/icons';
import { QrScannerService } from '../../core/services/qr-scanner.service';
import type { PluginListenerHandle } from '@capacitor/core';

type ScanState = 'checking' | 'explain' | 'scanning' | 'denied' | 'unsupported' | 'not-found';

/** Reached from the login screen (see login.page.html) — a referee who already has the app
 *  installed scans a *new* tournament's QR code from here instead of going back out to the
 *  phone's system camera. The very first tournament they ever join never goes through this
 *  page: that scan happens with the OS camera and lands directly on join.page.ts via the
 *  deep-linked URL, no in-app camera permission involved at all. */
@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent, IonIcon],
})
export class ScanPage implements ViewWillEnter, ViewWillLeave {
  private readonly scanner = inject(QrScannerService);
  private readonly router = inject(Router);

  private listenerHandle: PluginListenerHandle | null = null;

  readonly state = signal<ScanState>('checking');
  readonly torchOn = signal(false);
  readonly torchAvailable = signal(false);

  constructor() {
    addIcons({ cameraOutline, flashOutline, flashOffOutline, closeOutline, settingsOutline });
  }

  async ionViewWillEnter(): Promise<void> {
    this.state.set('checking');
    if (!(await this.scanner.isSupported())) {
      this.state.set('unsupported');
      return;
    }

    const permission = await this.scanner.checkPermission();
    if (permission === 'granted') {
      await this.beginScan();
    } else {
      this.state.set('explain');
    }
  }

  async ionViewWillLeave(): Promise<void> {
    await this.stopScan();
  }

  async requestAccess(): Promise<void> {
    const permission = await this.scanner.requestPermission();
    if (permission === 'granted') {
      await this.beginScan();
    } else {
      this.state.set('denied');
    }
  }

  openSettings(): void {
    void this.scanner.openSettings();
  }

  private async beginScan(): Promise<void> {
    this.state.set('scanning');
    this.torchOn.set(false);
    this.torchAvailable.set(await this.scanner.isTorchAvailable());
    this.listenerHandle = await this.scanner.startScan((rawValue) => this.handleBarcode(rawValue));
  }

  private async handleBarcode(rawValue: string): Promise<void> {
    const token = this.extractJoinToken(rawValue);
    if (!token) {
      this.state.set('not-found');
      await this.stopScan();
      return;
    }
    await this.stopScan();
    void this.router.navigate(['/join', token]);
  }

  /** Accepts the full join URL encoded in the QR (…/join/:token) as well as a bare token, in
   *  case a tournament's code ever gets shared as plain text instead of a scanned QR. */
  private extractJoinToken(rawValue: string): string | null {
    try {
      const url = new URL(rawValue);
      const match = url.pathname.match(/\/join\/([^/]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return /^[A-Za-z0-9_-]{16,}$/.test(rawValue) ? rawValue : null;
    }
  }

  async retry(): Promise<void> {
    await this.ionViewWillEnter();
  }

  async toggleTorch(): Promise<void> {
    await this.scanner.toggleTorch();
    this.torchOn.update((v) => !v);
  }

  private async stopScan(): Promise<void> {
    if (this.state() !== 'scanning' && !this.listenerHandle) return;
    const handle = this.listenerHandle;
    this.listenerHandle = null;
    await this.scanner.stopScan(handle);
  }
}
