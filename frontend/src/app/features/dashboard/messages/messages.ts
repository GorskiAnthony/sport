import { Component } from '@angular/core';
import { LucideMessageCircle } from '@lucide/angular';

@Component({
  selector: 'app-dashboard-messages-page',
  standalone: true,
  imports: [LucideMessageCircle],
  templateUrl: './messages.html',
})
export class DashboardMessagesPage {}
