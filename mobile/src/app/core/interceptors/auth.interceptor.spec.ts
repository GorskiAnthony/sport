import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds the Authorization header when a token is present', () => {
    authServiceSpy.getToken.and.returnValue('jwt-token');

    http.get('/api/tournaments/me').subscribe();

    const req = httpMock.expectOne('/api/tournaments/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({});
  });

  it('leaves the request untouched when there is no token', () => {
    authServiceSpy.getToken.and.returnValue(null);

    http.get('/api/tournaments/me').subscribe();

    const req = httpMock.expectOne('/api/tournaments/me');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
