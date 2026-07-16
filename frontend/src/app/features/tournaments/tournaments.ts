import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentSummary } from '../../core/models/tournament.model';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { SPORT_ICONS, TOURNAMENT_STATUS_LABELS } from '../../shared/utils/labels';

@Component({
  selector: 'app-tournaments-page',
  standalone: true,
  imports: [RouterLink, PageHeader],
  templateUrl: './tournaments.html',
})
export class TournamentsPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);

  readonly tournaments = signal<TournamentSummary[]>([]);
  readonly loading = signal(true);
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  readonly statusStyles: Record<string, string> = {
    ONGOING: 'bg-green-500/20 text-green-400',
    UPCOMING: 'bg-amber-500/20 text-amber-400',
    FINISHED: 'bg-slate-500/20 text-slate-400',
  };

  ngOnInit(): void {
    this.tournamentService.getAll().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  icon(sport: string): string {
    return SPORT_ICONS[sport] ?? '🏆';
  }

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
  }

  dates(t: TournamentSummary): string {
    return `${t.startDate} – ${t.endDate}`;
  }
}
