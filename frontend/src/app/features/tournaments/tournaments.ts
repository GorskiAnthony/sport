import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentSummary } from '../../core/models/tournament.model';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { TOURNAMENT_STATUS_LABELS } from '../../shared/utils/labels';
import { StatusBadge } from '../../shared/ui/status-badge/status-badge';
import { SportIcon } from '../../shared/ui/sport-icon/sport-icon';
import { setPageMeta } from '../../shared/utils/seo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tournaments-page',
  standalone: true,
  imports: [RouterLink, PageHeader, StatusBadge, SportIcon],
  templateUrl: './tournaments.html',
})
export class TournamentsPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly document = inject(DOCUMENT);

  readonly tournaments = signal<TournamentSummary[]>([]);
  readonly loading = signal(true);
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  constructor() {
    setPageMeta(inject(Title), inject(Meta), {
      title: 'Tournois',
      description: 'Parcourez les tournois sportifs organisés sur Tournoi Center : dates, lieux, équipes et classements en direct.',
      url: this.document.location.origin + '/tournaments',
    });
  }

  ngOnInit(): void {
    this.tournamentService.getAll().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
  }

  dates(t: TournamentSummary): string {
    return `${t.startDate} – ${t.endDate}`;
  }
}
