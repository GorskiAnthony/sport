import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { LoginPage } from './login.page';
import { AuthResponse } from '../../../core/models/user.model';

describe('LoginPage', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const authResponse: AuthResponse = {
    token: 'jwt-token',
    user: { id: 1, name: 'Alice', email: 'alice@example.com', role: 'ORGANIZER', plan: 'CLASSIC' },
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  });

  function createPage(): LoginPage {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('creates', () => {
    expect(createPage()).toBeTruthy();
  });

  it('rejects submission with empty fields without calling the API', () => {
    const page = createPage();

    page.submit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(page.errors().email).toBeTruthy();
    expect(page.errors().password).toBeTruthy();
  });

  it('rejects an invalid email format', () => {
    const page = createPage();
    page.onEmailInput('not-an-email');
    page.onPasswordInput('secret');

    page.submit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(page.errors().email).toContain('invalide');
  });

  it('logs in an organizer and navigates to /tournaments', () => {
    authServiceSpy.login.and.returnValue(of(authResponse));
    const page = createPage();
    page.onEmailInput(authResponse.user.email);
    page.onPasswordInput('secret');

    page.submit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({ email: authResponse.user.email, password: 'secret' });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tournaments']);
    expect(page.loading()).toBeFalse();
  });

  it('surfaces a field error when the account is unknown', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { code: 'EMAIL_NOT_FOUND' }, status: 404 })),
    );
    const page = createPage();
    page.onEmailInput(authResponse.user.email);
    page.onPasswordInput('secret');

    page.submit();

    expect(page.errors().email).toContain('Aucun compte');
    expect(page.loading()).toBeFalse();
  });

  it('surfaces a field error when the password is wrong', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { code: 'WRONG_PASSWORD' }, status: 401 })),
    );
    const page = createPage();
    page.onEmailInput(authResponse.user.email);
    page.onPasswordInput('wrong');

    page.submit();

    expect(page.errors().password).toContain('incorrect');
  });
});
