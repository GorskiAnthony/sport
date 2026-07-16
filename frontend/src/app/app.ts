import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /** Forces NotificationService to instantiate at startup (not just when the /home layout is
   *  visited) so its live-notification subscription is active everywhere, including the public
   *  tournament page where "follow team" is used. */
  private readonly notificationService = inject(NotificationService);
}
