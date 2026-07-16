import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatchService } from '../../../core/services/match.service';
import { Match } from '../../../core/models/match.model';
import { ToastService } from '../../../core/services/toast.service';
import { MATCH_STATUS_LABELS } from '../../../shared/utils/labels';

@Component({
  selector: 'app-dashboard-match-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './match-detail.html',
})
export class DashboardMatchDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);
  private readonly toast = inject(ToastService);

  readonly match = signal<Match | null>(null);
  readonly loading = signal(true);
  readonly homeScoreInput = signal('');
  readonly awayScoreInput = signal('');
  readonly saving = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.matchService.getById(id).subscribe({
      next: (match) => {
        this.match.set(match);
        this.homeScoreInput.set(match.homeScore !== null ? String(match.homeScore) : '');
        this.awayScoreInput.set(match.awayScore !== null ? String(match.awayScore) : '');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: string): string {
    return MATCH_STATUS_LABELS[status as keyof typeof MATCH_STATUS_LABELS] ?? status;
  }

  saveScore(): void {
    const match = this.match();
    if (!match) return;
    const homeScore = Number(this.homeScoreInput());
    const awayScore = Number(this.awayScoreInput());
    if (Number.isNaN(homeScore) || Number.isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      this.toast.error('Merci de saisir un score valide.');
      return;
    }

    this.saving.set(true);
    this.matchService.updateScore(match.id, { homeScore, awayScore }).subscribe({
      next: (updated) => {
        this.match.set(updated);
        this.saving.set(false);
        this.toast.success('Score mis à jour.', 'Enregistré');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Une erreur est survenue.');
      },
    });
  }
}
