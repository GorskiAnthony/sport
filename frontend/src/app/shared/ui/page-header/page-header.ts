import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.html',
})
export class PageHeader {
  readonly badge = input<string | undefined>(undefined);
  readonly title = input.required<string>();
  readonly highlight = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
}
