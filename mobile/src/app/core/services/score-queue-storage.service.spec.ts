import { TestBed } from '@angular/core/testing';
import { ScoreQueueStorageService, PendingScoreAction } from './score-queue-storage.service';

// Pas de mock ici, même raison que token-storage.service.spec.ts : ce test tape la vraie
// implémentation web de @capacitor/preferences et nettoie après chaque cas.
describe('ScoreQueueStorageService', () => {
  let service: ScoreQueueStorageService;

  const action: PendingScoreAction = { id: 'a1', matchId: 42, team: 'HOME', delta: 1 };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScoreQueueStorageService);
  });

  afterEach(() => service.setAll([]));

  it('returns an empty array when nothing is stored', async () => {
    expect(await service.getAll()).toEqual([]);
  });

  it('round-trips actions through setAll/getAll', async () => {
    await service.setAll([action]);

    expect(await service.getAll()).toEqual([action]);
  });

  it('overwrites the previous content on setAll', async () => {
    await service.setAll([action]);

    await service.setAll([]);

    expect(await service.getAll()).toEqual([]);
  });
});
