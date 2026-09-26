import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { SportIcon } from '../../shared/ui/sport-icon/sport-icon';
import { SPORTS } from '../../shared/utils/sports';
import { setPageMeta, setCanonical } from '../../shared/utils/seo';
import { TournamentService } from '../../core/services/tournament.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sports-page',
  standalone: true,
  imports: [PageHeader, SportIcon],
  templateUrl: './sports.html',
})
export class SportsPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);

  readonly sports = signal(SPORTS.map((sport) => ({ ...sport, count: 0 })));

  constructor() {
    const document = inject(DOCUMENT);
    const origin = document.location.origin;
    const url = `${origin}/sports`;

    setPageMeta(inject(Title), inject(Meta), {
      title: 'Sports',
      description: 'Football, basketball, tennis, volleyball, rugby, esport, handball, futsal : découvrez tous les sports gérables sur Matchday.',
      url,
      image: `${origin}/football-stadium-sunset.webp`,
    });
    setCanonical(document, url);
  }

  ngOnInit(): void {
    this.tournamentService.getAll().subscribe({
      next: (tournaments) => {
        const counts = new Map<string, number>();
        for (const t of tournaments) {
          counts.set(t.sport, (counts.get(t.sport) ?? 0) + 1);
        }
        this.sports.set(SPORTS.map((sport) => ({ ...sport, count: counts.get(sport.id) ?? 0 })));
      },
      error: () => {},
    });
  }
}
