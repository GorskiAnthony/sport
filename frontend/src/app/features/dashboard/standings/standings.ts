import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { TournamentDetail } from '../../../core/models/tournament.model';
import { TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';
import { Standing, computeStandings } from '../../../shared/utils/standings';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { Button } from '../../../shared/ui/button/button';

const TOURNAMENT_COLORS = ['bg-green-600', 'bg-blue-600', 'bg-purple-600'];

@Component({
  selector: 'app-dashboard-standings-page',
  standalone: true,
  imports: [RouterLink, StatusBadge, Button],
  templateUrl: './standings.html',
})
export class DashboardStandingsPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly authService = inject(AuthService);

  readonly tables = signal<{ tournament: TournamentDetail; rows: Standing[]; color: string }[]>([]);
  readonly loading = signal(true);

  // Export PDF des classements : réservé aux plans payants, ou à un tournoi payé via Pass
  // Événement tant que son crédit (7 jours après la fin) n'a pas expiré — un plan FREE ne
  // suffit pas à lui seul à en priver un acheteur ponctuel du Pass.
  canExportPdf(tournament: TournamentDetail): boolean {
    if ((this.authService.currentUser()?.plan ?? 'FREE') !== 'FREE') return true;
    const expiresAt = tournament.eventPassExpiresAt;
    return !!expiresAt && new Date(expiresAt).getTime() > Date.now();
  }

  readonly hasLockedPdfExport = computed(() =>
    this.tables().some((t) => !this.canExportPdf(t.tournament)),
  );

  // Tournoi en cours d'export : les autres sections passent en print:hidden le temps de l'impression
  // (sinon window.print() imprime toute la page, tous tournois confondus).
  readonly printingTournamentId = signal<number | null>(null);

  exportPdf(tournamentId: number): void {
    this.printingTournamentId.set(tournamentId);
    setTimeout(() => window.print(), 0);
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    this.printingTournamentId.set(null);
  }

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
