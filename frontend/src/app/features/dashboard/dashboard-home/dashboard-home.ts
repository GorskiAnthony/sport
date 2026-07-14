import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-dashboard-home-page',
  standalone: true,
  imports: [PageHeader],
  templateUrl: './dashboard-home.html',
})
export class DashboardHomePage {
  private readonly authService = inject(AuthService);
  readonly user = this.authService.currentUser;
}
