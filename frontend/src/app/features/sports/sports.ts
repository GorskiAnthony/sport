import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { SportIcon } from '../../shared/ui/sport-icon/sport-icon';
import { SPORTS } from '../../shared/utils/sports';
import { setPageMeta } from '../../shared/utils/seo';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sports-page',
  standalone: true,
  imports: [PageHeader, SportIcon],
  templateUrl: './sports.html',
})
export class SportsPage {
  constructor() {
    setPageMeta(inject(Title), inject(Meta), {
      title: 'Sports',
      description: 'Football, basketball, tennis, volleyball, rugby, esport, handball, futsal : découvrez tous les sports gérables sur Tournoi Center.',
    });
  }

  readonly sports = SPORTS.map((sport) => ({
    ...sport,
    count: SHOWCASE_COUNTS[sport.id] ?? 0,
  }));
}
