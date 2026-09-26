import { Injectable } from '@angular/core';
import { BarcodeFormat, BarcodeScanner, CameraPermissionState } from '@capacitor-mlkit/barcode-scanning';
import type { PluginListenerHandle } from '@capacitor/core';

/** Thin wrapper around @capacitor-mlkit/barcode-scanning — kept separate from ScanPage for the
 *  same reason as TokenStorageService: a Capacitor plugin is a registerPlugin() proxy that
 *  Jasmine can't reliably spyOn, so consuming code mocks this service instead of the plugin
 *  itself. startScan() makes the WebView background transparent (see scan.page.scss's
 *  .barcode-scanning-active) so the native camera preview underneath is visible — stopScan()
 *  always restores it, even on error, to avoid leaving the app stuck on a see-through screen. */
@Injectable({ providedIn: 'root' })
export class QrScannerService {
  isSupported(): Promise<boolean> {
    return BarcodeScanner.isSupported().then((r) => r.supported);
  }

  checkPermission(): Promise<CameraPermissionState> {
    return BarcodeScanner.checkPermissions().then((r) => r.camera);
  }

  requestPermission(): Promise<CameraPermissionState> {
    return BarcodeScanner.requestPermissions().then((r) => r.camera);
  }

  openSettings(): Promise<void> {
    return BarcodeScanner.openSettings();
  }

  isTorchAvailable(): Promise<boolean> {
    return BarcodeScanner.isTorchAvailable().then((r) => r.available);
  }

  toggleTorch(): Promise<void> {
    return BarcodeScanner.toggleTorch();
  }

  async startScan(onBarcode: (rawValue: string) => void): Promise<PluginListenerHandle> {
    document.body.classList.add('barcode-scanning-active');
    const handle = await BarcodeScanner.addListener('barcodesScanned', (event) => {
      const value = event.barcodes[0]?.rawValue ?? event.barcodes[0]?.displayValue;
      if (value) onBarcode(value);
    });
    try {
      await BarcodeScanner.startScan({ formats: [BarcodeFormat.QrCode] });
    } catch (err) {
      document.body.classList.remove('barcode-scanning-active');
      await handle.remove();
      throw err;
    }
    return handle;
  }

  async stopScan(handle: PluginListenerHandle | null): Promise<void> {
    document.body.classList.remove('barcode-scanning-active');
    await handle?.remove();
    await BarcodeScanner.stopScan();
  }
}
