import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TournamentService } from '../../../core/services/tournament.service';
import { TournamentDetail } from '../../../core/models/tournament.model';
import { TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';
import { Standing, computeStandings } from '../../../shared/utils/standings';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

const TOURNAMENT_COLORS = ['bg-green-600', 'bg-blue-600', 'bg-purple-600'];

@Component({
  selector: 'app-dashboard-standings-page',
  standalone: true,
  imports: [StatusBadge],
  templateUrl: './standings.html',
})
export class DashboardStandingsPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);

  readonly tables = signal<{ tournament: TournamentDetail; rows: Standing[]; color: string }[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.tournamentService.getMine().subscribe({
      next: (summaries) => {
        if (summaries.length === 0) {
          this.loading.set(false);
          return;
        }
        forkJoin(summaries.map((s) => this.tournamentService.getById(s.id).pipe(catchError(() => of(null))))).subscribe(
          (details) => {
            const tables = details
              .filter((d): d is TournamentDetail => d !== null)
              .map((tournament, i) => ({
                tournament,
                rows: computeStandings(tournament),
                color: TOURNAMENT_COLORS[i % TOURNAMENT_COLORS.length],
              }));
            this.tables.set(tables);
            this.loading.set(false);
          },
        );
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
  }
}
