import { Component } from '@angular/core';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { SPORTS } from '../../shared/utils/sports';

const SHOWCASE_COUNTS: Record<string, number> = {
  football: 1240,
  basketball: 380,
  tennis: 210,
  volleyball: 175,
  rugby: 145,
  esport: 220,
  handball: 130,
  futsal: 90,
};

@Component({
  selector: 'app-sports-page',
  standalone: true,
  imports: [PageHeader],
  templateUrl: './sports.html',
})
export class SportsPage {
  readonly sports = SPORTS.map((sport) => ({
    ...sport,
    count: SHOWCASE_COUNTS[sport.id] ?? 0,
  }));
}
