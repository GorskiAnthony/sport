import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TournamentService } from '../../../core/services/tournament.service';
import { TournamentDetail } from '../../../core/models/tournament.model';
import { Standing, computeStandings } from '../../../shared/utils/standings';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-spectator-standings-page',
  standalone: true,
  imports: [StatusBadge],
  templateUrl: './standings.html',
})
export class SpectatorStandingsPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);

  readonly tables = signal<{ tournament: TournamentDetail; rows: Standing[] }[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.tournamentService.getAll().subscribe({
      next: (summaries) => {
        const ongoing = summaries.filter((s) => s.status === 'ONGOING');
        if (ongoing.length === 0) {
          this.loading.set(false);
          return;
        }
        forkJoin(ongoing.map((s) => this.tournamentService.getById(s.id).pipe(catchError(() => of(null))))).subscribe(
          (details) => {
            const tables = details
              .filter((d): d is TournamentDetail => d !== null)
              .map((tournament) => ({ tournament, rows: computeStandings(tournament) }));
            this.tables.set(tables);
            this.loading.set(false);
          },
        );
      },
      error: () => this.loading.set(false),
    });
  }
}
