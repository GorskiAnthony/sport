import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { TournamentSummary } from '../../../core/models/tournament.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModal } from '../../../shared/ui/confirm-modal/confirm-modal';
import { TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { SportIcon } from '../../../shared/ui/sport-icon/sport-icon';
import { ShareModal } from '../../../shared/ui/share-modal/share-modal';

@Component({
  selector: 'app-dashboard-tournaments-page',
  standalone: true,
  imports: [RouterLink, ConfirmModal, StatusBadge, SportIcon, ShareModal],
  templateUrl: './tournaments.html',
})
export class DashboardTournamentsPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly tournaments = signal<TournamentSummary[]>([]);
  readonly loading = signal(true);
  readonly skeletons = [1, 2, 3];
  readonly pending = signal<TournamentSummary | null>(null);
  readonly shareTarget = signal<TournamentSummary | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.tournamentService.getMine().subscribe({
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

  goToDetail(t: TournamentSummary): void {
    this.router.navigate(['/dashboard/tournaments', t.id]);
  }

  confirmDelete(): void {
    const target = this.pending();
    if (!target) return;
    this.tournamentService.delete(target.id).subscribe({
      next: () => {
        this.tournaments.update((list) => list.filter((t) => t.id !== target.id));
        this.toast.success(`${target.name} supprimé.`, 'Tournoi supprimé');
        this.pending.set(null);
      },
      error: () => {
        this.toast.error('Une erreur est survenue.', 'Erreur');
        this.pending.set(null);
      },
    });
  }
}
