import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toDataURL } from 'qrcode';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentDetail } from '../../core/models/tournament.model';
import { SPORT_ICONS } from '../../shared/utils/labels';
import { formatDateFr } from '../../shared/utils/date';
import { tournamentShareSlug } from '../../shared/utils/slug';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-print-tournament-page',
  standalone: true,
  templateUrl: './print-tournament.html',
})
export class PrintTournamentPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);

  readonly tournament = signal<TournamentDetail | null>(null);
  readonly loading = signal(true);
  readonly qrDataUrl = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }

    this.tournamentService.getById(id).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
        const url = `${window.location.origin}/t/${tournamentShareSlug(id, tournament.name)}`;
        toDataURL(url, { margin: 1, width: 320 }).then((dataUrl) => this.qrDataUrl.set(dataUrl));
      },
      error: () => this.loading.set(false),
    });
  }

  icon(sport: string): string {
    return SPORT_ICONS[sport] ?? '🏆';
  }

  dateRange(t: TournamentDetail): string {
    return `${formatDateFr(t.startDate)} – ${formatDateFr(t.endDate)}`;
  }

  print(): void {
    window.print();
  }
}
