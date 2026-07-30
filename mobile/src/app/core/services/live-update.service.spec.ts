import { Client } from '@stomp/stompjs';
import { LiveUpdateService } from './live-update.service';
import { environment } from '../../../environments/environment';

// On ne se connecte pas à un vrai broker dans les tests : on espionne le prototype de Client
// pour intercepter activate()/subscribe()/deactivate() et simuler la connexion nous-mêmes.
describe('LiveUpdateService', () => {
  let service: LiveUpdateService;
  let activateSpy: jasmine.Spy;
  let subscribeSpy: jasmine.Spy;
  let deactivateSpy: jasmine.Spy;

  beforeEach(() => {
    service = new LiveUpdateService();
    activateSpy = spyOn(Client.prototype, 'activate');
    subscribeSpy = spyOn(Client.prototype, 'subscribe');
    deactivateSpy = spyOn(Client.prototype, 'deactivate');
  });

  function activatedClient(): Client {
    return activateSpy.calls.mostRecent().object as Client;
  }

  it('connects with a ws(s) URL derived from environment.apiUrl', () => {
    service.subscribeToTournament(7, () => {});

    expect(activateSpy).toHaveBeenCalled();
    expect(activatedClient().brokerURL).toBe(`${environment.apiUrl.replace(/^http/, 'ws')}/ws`);
  });

  it('subscribes to the tournament topic once connected and forwards updates', () => {
    const onUpdate = jasmine.createSpy('onUpdate');
    service.subscribeToTournament(7, onUpdate);

    const client = activatedClient();
    (client.onConnect as unknown as () => void)?.();

    expect(subscribeSpy).toHaveBeenCalledWith('/topic/tournaments/7', jasmine.any(Function));
    const messageHandler = subscribeSpy.calls.mostRecent().args[1] as () => void;
    messageHandler();

    expect(onUpdate).toHaveBeenCalled();
  });

  it('returns an unsubscribe function that deactivates the client', () => {
    const unsubscribe = service.subscribeToTournament(7, () => {});

    unsubscribe();

    expect(deactivateSpy).toHaveBeenCalled();
  });
});
