import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AccountPage } from './account.page';
import { User } from '../../core/models/user.model';

describe('AccountPage', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const user: User = {
    id: 1,
    name: 'Alex Martin',
    email: 'alex@example.com',
    role: 'ORGANIZER',
    plan: 'CLASSIC',
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'refreshUser'], { currentUser: () => user });
    authServiceSpy.refreshUser.and.returnValue(of(user));
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AccountPage],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  });

  function createPage(): AccountPage {
    const fixture = TestBed.createComponent(AccountPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    fixture.detectChanges();
    return page;
  }

  it('shows the initials, name, email and plan of the current user', () => {
    const page = createPage();

    expect(page.initials()).toBe('AM');
    expect(page.planMeta().label).toBe('Classic');
  });

  it('refreshes the user on entering the screen', () => {
    createPage();

    expect(authServiceSpy.refreshUser).toHaveBeenCalled();
  });

  it('logs out and navigates to /login', () => {
    const page = createPage();

    page.logout();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('renders a logout button the user can tap', () => {
    const fixture = TestBed.createComponent(AccountPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('ion-button'));

    expect(button).not.toBeNull();
  });
});
