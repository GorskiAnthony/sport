import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatchService } from './match.service';
import { ConnectivityService } from './connectivity.service';
import { ScoreQueueStorageService, PendingScoreAction } from './score-queue-storage.service';
import { ScoreQueueService } from './score-queue.service';
import { Match } from '../models/match.model';

describe('ScoreQueueService', () => {
  let matchServiceSpy: jasmine.SpyObj<MatchService>;
  let storageSpy: jasmine.SpyObj<ScoreQueueStorageService>;
  let onlineSignal: ReturnType<typeof signal<boolean>>;
  let stored: PendingScoreAction[];

  const match = { id: 1 } as Match;

  beforeEach(() => {
    stored = [];
    matchServiceSpy = jasmine.createSpyObj('MatchService', ['recordGoal']);
    storageSpy = jasmine.createSpyObj('ScoreQueueStorageService', ['getAll', 'setAll']);
    storageSpy.getAll.and.callFake(() => Promise.resolve(stored));
    storageSpy.setAll.and.callFake((actions: PendingScoreAction[]) => {
      stored = actions;
      return Promise.resolve();
    });
    onlineSignal = signal(true);

    TestBed.configureTestingModule({
      providers: [
        { provide: MatchService, useValue: matchServiceSpy },
        { provide: ScoreQueueStorageService, useValue: storageSpy },
        { provide: ConnectivityService, useValue: { online: onlineSignal } },
      ],
    });
  });

  function createService(): ScoreQueueService {
    return TestBed.inject(ScoreQueueService);
  }

  it('starts with no pending actions', () => {
    const service = createService();

    expect(service.pendingCount()).toBe(0);
  });

  it('enqueue() adds an action and persists it', async () => {
    const service = createService();

    await service.enqueue(1, 'HOME', 1);

    expect(service.pendingCount()).toBe(1);
    expect(storageSpy.setAll).toHaveBeenCalledWith([jasmine.objectContaining({ matchId: 1, team: 'HOME', delta: 1 })]);
  });

  it('flush() does nothing while offline', async () => {
    onlineSignal.set(false);
    const service = createService();
    await service.enqueue(1, 'HOME', 1);

    await service.flush();

    expect(matchServiceSpy.recordGoal).not.toHaveBeenCalled();
    expect(service.pendingCount()).toBe(1);
  });

  it('flush() replays queued actions in order and empties the queue on success', async () => {
    matchServiceSpy.recordGoal.and.returnValue(of(match));
    const service = createService();
    await service.enqueue(1, 'HOME', 1);
    await service.enqueue(2, 'AWAY', -1);

    await service.flush();

    expect(matchServiceSpy.recordGoal.calls.allArgs()).toEqual([
      [1, 'HOME', 1],
      [2, 'AWAY', -1],
    ]);
    expect(service.pendingCount()).toBe(0);
    expect(stored).toEqual([]);
  });

  it('flush() stops at the first failure and keeps the rest queued', async () => {
    matchServiceSpy.recordGoal.and.returnValue(throwError(() => new Error('network down')));
    const service = createService();
    await service.enqueue(1, 'HOME', 1);
    await service.enqueue(2, 'AWAY', -1);

    await service.flush();

    expect(matchServiceSpy.recordGoal).toHaveBeenCalledTimes(1);
    expect(service.pendingCount()).toBe(2);
  });

  it('automatically flushes when connectivity comes back online', async () => {
    onlineSignal.set(false);
    const service = createService();
    await service.enqueue(1, 'HOME', 1);
    matchServiceSpy.recordGoal.and.returnValue(of(match));

    onlineSignal.set(true);
    TestBed.inject(ApplicationRef).tick();
    // Attend un macrotask plutôt qu'un nombre fixe de microtasks : la chaîne réelle (ready →
    // flush → firstValueFrom → set/storage) traverse plusieurs hops, un macrotask garantit que
    // la file de microtasks est entièrement vidée avant de continuer.
    await new Promise((resolve) => setTimeout(resolve));

    expect(matchServiceSpy.recordGoal).toHaveBeenCalledWith(1, 'HOME', 1);
    expect(service.pendingCount()).toBe(0);
  });
});
