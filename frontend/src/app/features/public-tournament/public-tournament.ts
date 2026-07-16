import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentService } from '../../core/services/tournament.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TournamentDetail } from '../../core/models/tournament.model';
import { Match } from '../../core/models/match.model';
import { computeStandings, Standing } from '../../shared/utils/standings';
import { SPORT_ICONS, TOURNAMENT_STATUS_LABELS } from '../../shared/utils/labels';

interface PhaseGroup {
  label: string;
  matches: Match[];
}

@Component({
  selector: 'app-public-tournament-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-tournament.html',
})
export class PublicTournamentPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(TournamentService);
  private readonly teamService = inject(TeamService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly tournament = signal<TournamentDetail | null>(null);
  readonly loading = signal(true);
  readonly followedTeamIds = signal<Set<number>>(new Set());
  readonly followPending = signal<number | null>(null);

  readonly standings = computed<Standing[]>(() => {
    const t = this.tournament();
    return t ? computeStandings(t) : [];
  });

  readonly phaseGroups = computed<PhaseGroup[]>(() => {
    const t = this.tournament();
    if (!t) return [];
    const byPhase = new Map<string, Match[]>();
    const order: string[] = [];
    for (const match of [...t.matches].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.id - b.id)) {
      const phase = match.phase ?? '';
      if (!byPhase.has(phase)) {
        byPhase.set(phase, []);
        order.push(phase);
      }
      byPhase.get(phase)!.push(match);
    }
    return order.map((label) => ({ label, matches: byPhase.get(label)! }));
  });

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
        if (this.auth.isAuthenticated()) {
          this.loadFollowedState(tournament);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private loadFollowedState(tournament: TournamentDetail): void {
    tournament.teams.forEach((team) => {
      this.teamService.isFollowing(team.id).subscribe({
        next: ({ following }) => {
          if (following) {
            this.followedTeamIds.update((set) => new Set(set).add(team.id));
          }
        },
      });
    });
  }

  icon(sport: string): string {
    return SPORT_ICONS[sport] ?? '🏆';
  }

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
  }

  isFollowing(teamId: number): boolean {
    return this.followedTeamIds().has(teamId);
  }

  toggleFollow(teamId: number): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/register'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.followPending.set(teamId);
    const wasFollowing = this.isFollowing(teamId);
    const request$ = wasFollowing ? this.teamService.unfollow(teamId) : this.teamService.follow(teamId);
    request$.subscribe({
      next: () => {
        this.followPending.set(null);
        this.followedTeamIds.update((set) => {
          const next = new Set(set);
          wasFollowing ? next.delete(teamId) : next.add(teamId);
          return next;
        });
        this.toast.success(wasFollowing ? 'Équipe retirée de vos favoris.' : 'Équipe ajoutée à vos favoris.');
      },
      error: () => {
        this.followPending.set(null);
        this.toast.error('Une erreur est survenue.');
      },
    });
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
