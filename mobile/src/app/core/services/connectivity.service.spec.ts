import { TestBed } from '@angular/core/testing';
import { ConnectivityService } from './connectivity.service';

// Pas de mock du plugin : même raison que token-storage.service.spec.ts — @capacitor/network
// expose un proxy (registerPlugin) qu'on ne peut pas spier de façon fiable, donc ce test tape la
// vraie implémentation web (repose sur navigator.onLine dans Chrome headless). Les scénarios
// hors-ligne/reconnexion sont testés plus haut, contre une ConnectivityService mockée (voir
// score-queue.service.spec.ts et match-detail.page.spec.ts).
describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnectivityService);
  });

  it('starts online by default, before init() resolves', () => {
    expect(service.online()).toBeTrue();
  });

  it('reflects the real network status once initialized', async () => {
    await service.init();

    expect(service.online()).toBe(navigator.onLine);
  });
});
