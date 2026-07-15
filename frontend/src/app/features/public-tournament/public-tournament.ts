import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentDetail } from '../../core/models/tournament.model';
import { SPORT_ICONS, TOURNAMENT_STATUS_LABELS } from '../../shared/utils/labels';

@Component({
  selector: 'app-public-tournament-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-tournament.html',
})
export class PublicTournamentPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);

  readonly tournament = signal<TournamentDetail | null>(null);
  readonly loading = signal(true);

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

  get details() {
    const t = this.tournament();
    if (!t) return [];
    return [
      { label: 'Lieu', value: t.location ?? '—' },
      { label: 'Dates', value: `${t.startDate} – ${t.endDate}` },
      { label: 'Équipes', value: String(t.teams.length) },
      { label: 'Statut', value: this.statusLabel(t.status) },
    ];
  }
}
