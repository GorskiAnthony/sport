import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenStorageSpy: jasmine.SpyObj<TokenStorageService>;

  const authResponse: AuthResponse = {
    token: 'jwt-token',
    user: { id: 1, name: 'Alice', email: 'alice@example.com', role: 'ORGANIZER', plan: 'CLASSIC' },
  };

  beforeEach(() => {
    tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', [
      'getToken',
      'getUser',
      'setSession',
      'clear',
      'removeUser',
    ]);
    tokenStorageSpy.setSession.and.resolveTo();
    tokenStorageSpy.clear.and.resolveTo();
    tokenStorageSpy.removeUser.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TokenStorageService, useValue: tokenStorageSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts unauthenticated with no cached token', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('persists the session and updates signals on login', () => {
    service.login({ email: authResponse.user.email, password: 'secret' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(authResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getToken()).toBe('jwt-token');
    expect(service.currentUser()).toEqual(authResponse.user);
    expect(tokenStorageSpy.setSession).toHaveBeenCalledWith('jwt-token', JSON.stringify(authResponse.user));
  });

  it('restores a previously persisted session from storage', async () => {
    tokenStorageSpy.getToken.and.resolveTo('stored-token');
    tokenStorageSpy.getUser.and.resolveTo(JSON.stringify(authResponse.user));

    await service.restoreSession();

    expect(service.getToken()).toBe('stored-token');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()).toEqual(authResponse.user);
  });

  it('stays unauthenticated when storage has nothing saved', async () => {
    tokenStorageSpy.getToken.and.resolveTo(null);
    tokenStorageSpy.getUser.and.resolveTo(null);

    await service.restoreSession();

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('drops corrupted stored user data instead of crashing', async () => {
    tokenStorageSpy.getToken.and.resolveTo('stored-token');
    tokenStorageSpy.getUser.and.resolveTo('{not-json');

    await service.restoreSession();

    expect(service.getToken()).toBe('stored-token');
    expect(service.currentUser()).toBeNull();
    expect(tokenStorageSpy.removeUser).toHaveBeenCalled();
  });

  it('clears the session and revokes the token on logout', () => {
    service.login({ email: authResponse.user.email, password: 'secret' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(authResponse);

    service.logout();
    httpMock.expectOne(`${environment.apiUrl}/auth/logout`).flush(null);

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
    expect(tokenStorageSpy.clear).toHaveBeenCalled();
  });

  it('does not call the revoke endpoint on logout when there was no session', () => {
    service.logout();

    httpMock.expectNone(`${environment.apiUrl}/auth/logout`);
    expect(tokenStorageSpy.clear).toHaveBeenCalled();
  });
});
