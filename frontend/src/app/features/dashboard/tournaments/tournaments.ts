import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { TournamentSummary } from '../../../core/models/tournament.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModal } from '../../../shared/ui/confirm-modal/confirm-modal';
import { SPORT_ICONS, TOURNAMENT_STATUS_LABELS } from '../../../shared/utils/labels';

@Component({
  selector: 'app-dashboard-tournaments-page',
  standalone: true,
  imports: [RouterLink, ConfirmModal],
  templateUrl: './tournaments.html',
})
export class DashboardTournamentsPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly toast = inject(ToastService);

  readonly tournaments = signal<TournamentSummary[]>([]);
  readonly loading = signal(true);
  readonly skeletons = [1, 2, 3];
  readonly pending = signal<TournamentSummary | null>(null);
  readonly shareTarget = signal<TournamentSummary | null>(null);

  readonly statusStyles: Record<string, string> = {
    ONGOING: 'bg-green-500/20 text-green-400 border-green-500/20',
    UPCOMING: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
    FINISHED: 'bg-slate-500/20 text-slate-400 border-slate-500/20',
  };

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

  icon(sport: string): string {
    return SPORT_ICONS[sport] ?? '🏆';
  }

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
  }

  dates(t: TournamentSummary): string {
    return `${t.startDate} – ${t.endDate}`;
  }

  shareUrl(t: TournamentSummary): string {
    return `${window.location.origin}/t/${t.id}`;
  }

  copyShareLink(t: TournamentSummary): void {
    navigator.clipboard.writeText(this.shareUrl(t)).then(() => this.toast.success('Lien copié dans le presse-papiers.'));
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
