import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '../../shared/ui/button/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-not-found-page',
  standalone: true,
  imports: [Button],
  templateUrl: './not-found.html',
})
export class NotFoundPage {}
