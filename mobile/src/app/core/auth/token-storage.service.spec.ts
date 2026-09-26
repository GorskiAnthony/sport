import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

// Pas de mock ici : @capacitor/preferences expose un proxy (registerPlugin) qu'on ne peut pas
// spier de façon fiable (voir le commentaire dans token-storage.service.ts), donc ce test tape
// la vraie implémentation web (persistée dans le Chrome headless de Karma) et nettoie après
// chaque cas pour ne pas polluer les autres tests.
describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorageService);
  });

  afterEach(() => service.clear());

  it('returns null when nothing is stored', async () => {
    expect(await service.getToken()).toBeNull();
    expect(await service.getUser()).toBeNull();
  });

  it('round-trips a session through setSession/getToken/getUser', async () => {
    await service.setSession('jwt-token', '{"id":1}');

    expect(await service.getToken()).toBe('jwt-token');
    expect(await service.getUser()).toBe('{"id":1}');
  });

  it('clear() removes both the token and the user', async () => {
    await service.setSession('jwt-token', '{"id":1}');

    await service.clear();

    expect(await service.getToken()).toBeNull();
    expect(await service.getUser()).toBeNull();
  });

  it('removeUser() only clears the stored user, not the token', async () => {
    await service.setSession('jwt-token', '{"id":1}');

    await service.removeUser();

    expect(await service.getToken()).toBe('jwt-token');
    expect(await service.getUser()).toBeNull();
  });
});
