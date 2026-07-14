import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-spectator-home-page',
  standalone: true,
  imports: [PageHeader],
  templateUrl: './spectator-home.html',
})
export class SpectatorHomePage {
  private readonly authService = inject(AuthService);
  readonly user = this.authService.currentUser;
}
