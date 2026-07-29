import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatchService } from '../../../core/services/match.service';
import { Match } from '../../../core/models/match.model';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/auth/auth.service';
import { MATCH_STATUS_LABELS } from '../../../shared/utils/labels';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-dashboard-match-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, StatusBadge],
  templateUrl: './match-detail.html',
})
export class DashboardMatchDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);

  readonly isPro = computed(() => this.authService.currentUser()?.plan === 'PRO');

  readonly match = signal<Match | null>(null);
  readonly loading = signal(true);
  readonly homeScoreInput = signal('');
  readonly awayScoreInput = signal('');
  readonly homeFairPlayInput = signal('');
  readonly awayFairPlayInput = signal('');
  readonly saving = signal(false);

  ngOnInit(): void {
    // Same staleness concern as the other Pro-gated pages: an organizer who just upgraded
    // shouldn't have to visit Paramètres first for the fair-play fields to appear.
    this.authService.refreshUser().subscribe({ error: () => {} });

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
        this.homeFairPlayInput.set(match.homeFairPlay !== null ? String(match.homeFairPlay) : '');
        this.awayFairPlayInput.set(match.awayFairPlay !== null ? String(match.awayFairPlay) : '');
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

    let homeFairPlay: number | undefined;
    let awayFairPlay: number | undefined;
    if (this.isPro()) {
      const rawHome = this.homeFairPlayInput().trim();
      const rawAway = this.awayFairPlayInput().trim();
      if (rawHome || rawAway) {
        homeFairPlay = Number(rawHome);
        awayFairPlay = Number(rawAway);
        const isValid = (n: number) => Number.isInteger(n) && n >= 0 && n <= 10;
        if (!isValid(homeFairPlay) || !isValid(awayFairPlay)) {
          this.toast.error('La note fair-play doit être un entier entre 0 et 10.');
          return;
        }
      }
    }

    this.saving.set(true);
    this.matchService.updateScore(match.id, { homeScore, awayScore, homeFairPlay, awayFairPlay }).subscribe({
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
