import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import type { PluginListenerHandle } from '@capacitor/core';
import { QrScannerService } from '../../core/services/qr-scanner.service';
import { ScanPage } from './scan.page';

describe('ScanPage', () => {
  let scannerSpy: jasmine.SpyObj<QrScannerService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let handle: jasmine.SpyObj<PluginListenerHandle>;

  beforeEach(async () => {
    handle = jasmine.createSpyObj('PluginListenerHandle', ['remove']);
    scannerSpy = jasmine.createSpyObj('QrScannerService', [
      'isSupported',
      'checkPermission',
      'requestPermission',
      'openSettings',
      'startScan',
      'stopScan',
      'isTorchAvailable',
      'toggleTorch',
    ]);
    scannerSpy.isSupported.and.resolveTo(true);
    scannerSpy.isTorchAvailable.and.resolveTo(false);
    scannerSpy.startScan.and.resolveTo(handle);
    scannerSpy.stopScan.and.resolveTo(undefined);
    // ion-back-button subscribes to router.events in its constructor — a bare method-only spy
    // makes that throw (see live-score.page.spec.ts for the same fix).
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: EMPTY });

    await TestBed.configureTestingModule({
      imports: [ScanPage],
      providers: [
        { provide: QrScannerService, useValue: scannerSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  });

  function createPage(): ScanPage {
    const fixture = TestBed.createComponent(ScanPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('shows the unsupported state when the device has no usable camera', async () => {
    scannerSpy.isSupported.and.resolveTo(false);
    const page = createPage();

    await page.ionViewWillEnter();

    expect(page.state()).toBe('unsupported');
    expect(scannerSpy.checkPermission).not.toHaveBeenCalled();
  });

  it('starts scanning immediately when permission is already granted', async () => {
    scannerSpy.checkPermission.and.resolveTo('granted');
    const page = createPage();

    await page.ionViewWillEnter();

    expect(page.state()).toBe('scanning');
    expect(scannerSpy.startScan).toHaveBeenCalled();
  });

  it('shows the explainer before asking for permission when not yet granted', async () => {
    scannerSpy.checkPermission.and.resolveTo('prompt');
    const page = createPage();

    await page.ionViewWillEnter();

    expect(page.state()).toBe('explain');
    expect(scannerSpy.startScan).not.toHaveBeenCalled();
  });

  it('starts scanning once the user grants access from the explainer', async () => {
    scannerSpy.checkPermission.and.resolveTo('prompt');
    scannerSpy.requestPermission.and.resolveTo('granted');
    const page = createPage();
    await page.ionViewWillEnter();

    await page.requestAccess();

    expect(page.state()).toBe('scanning');
  });

  it('shows the denied state when the user refuses access', async () => {
    scannerSpy.checkPermission.and.resolveTo('prompt');
    scannerSpy.requestPermission.and.resolveTo('denied');
    const page = createPage();
    await page.ionViewWillEnter();

    await page.requestAccess();

    expect(page.state()).toBe('denied');
    expect(scannerSpy.startScan).not.toHaveBeenCalled();
  });

  it('navigates to the join flow when a valid tournament QR code is scanned', async () => {
    scannerSpy.checkPermission.and.resolveTo('granted');
    const page = createPage();
    await page.ionViewWillEnter();
    const onBarcode = scannerSpy.startScan.calls.mostRecent().args[0];

    await onBarcode('https://app.tournoicenter.fr/join/abc123');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/join', 'abc123']);
    expect(scannerSpy.stopScan).toHaveBeenCalledWith(handle);
  });

  it('accepts a bare token if the QR was not encoded as a full URL', async () => {
    scannerSpy.checkPermission.and.resolveTo('granted');
    const page = createPage();
    await page.ionViewWillEnter();
    const onBarcode = scannerSpy.startScan.calls.mostRecent().args[0];

    await onBarcode('kKkyLrXrrByrM2r5vz9Hh-uH29zTqGJDHzoTXaIOua0');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/join', 'kKkyLrXrrByrM2r5vz9Hh-uH29zTqGJDHzoTXaIOua0']);
  });

  it('shows the not-found state for a QR code that is not a tournament code', async () => {
    scannerSpy.checkPermission.and.resolveTo('granted');
    const page = createPage();
    await page.ionViewWillEnter();
    const onBarcode = scannerSpy.startScan.calls.mostRecent().args[0];

    await onBarcode('https://example.com/unrelated');

    expect(page.state()).toBe('not-found');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('stops the scan on ionViewWillLeave so the camera is released', async () => {
    scannerSpy.checkPermission.and.resolveTo('granted');
    const page = createPage();
    await page.ionViewWillEnter();

    await page.ionViewWillLeave();

    expect(scannerSpy.stopScan).toHaveBeenCalledWith(handle);
  });
});
