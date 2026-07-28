import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentService } from '../../core/services/tournament.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LiveUpdateService } from '../../core/services/live-update.service';
import { TournamentDetail } from '../../core/models/tournament.model';
import { Match } from '../../core/models/match.model';
import { computeStandings, Standing } from '../../shared/utils/standings';
import { TOURNAMENT_STATUS_LABELS } from '../../shared/utils/labels';
import { GroupStandings, StandingsGroup } from '../../shared/ui/group-standings/group-standings';
import { SportIcon } from '../../shared/ui/sport-icon/sport-icon';
import { TournamentMap } from '../../shared/ui/tournament-map/tournament-map';
import { formatDateFr } from '../../shared/utils/date';
import { setPageMeta, setJsonLd } from '../../shared/utils/seo';
import { LucideStar } from '@lucide/angular';
import { Meta, Title } from '@angular/platform-browser';

interface PhaseGroup {
  label: string;
  matches: Match[];
}

const GROUP_PHASE_PREFIX = 'Groupe ';

@Component({
  selector: 'app-public-tournament-page',
  standalone: true,
  imports: [RouterLink, GroupStandings, SportIcon, TournamentMap, LucideStar],
  templateUrl: './public-tournament.html',
})
export class PublicTournamentPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(TournamentService);
  private readonly teamService = inject(TeamService);
  private readonly toast = inject(ToastService);
  private readonly liveUpdate = inject(LiveUpdateService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  readonly auth = inject(AuthService);

  constructor() {
    setPageMeta('Tournoi', 'Suivez ce tournoi en direct sur Tournoi Center : classement, matchs et équipes.');
  }

  private tournamentId = 0;
  private unsubscribeLive: (() => void) | null = null;

  readonly tournament = signal<TournamentDetail | null>(null);
  readonly loading = signal(true);
  readonly followedTeamIds = signal<Set<number>>(new Set());
  readonly followPending = signal<number | null>(null);

  readonly standings = computed<Standing[]>(() => {
    const t = this.tournament();
    if (!t || t.format === 'GROUP_KNOCKOUT') return [];
    return computeStandings(t);
  });

  readonly groupStandingsData = computed<StandingsGroup[]>(() => {
    const t = this.tournament();
    if (!t || t.format !== 'GROUP_KNOCKOUT') return [];
    const byPhase = new Map<string, Match[]>();
    const order: string[] = [];
    for (const match of [...t.matches].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.id - b.id)) {
      const phase = match.phase ?? '';
      if (!phase.startsWith(GROUP_PHASE_PREFIX)) continue;
      if (!byPhase.has(phase)) {
        byPhase.set(phase, []);
        order.push(phase);
      }
      byPhase.get(phase)!.push(match);
    }
    return order.map((label) => {
      const matches = byPhase.get(label)!;
      const teamIds = new Set<number>();
      matches.forEach((m) => { teamIds.add(m.homeTeam.id); teamIds.add(m.awayTeam.id); });
      const teams = t.teams.filter((team) => teamIds.has(team.id));
      return { label, teams, matches };
    });
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
    // The URL uses a "{id}-{slug}" pretty link (e.g. /t/18-mon-tournoi) — the numeric id
    // is authoritative and always leads, so parseInt stops at the first hyphen correctly.
    const id = parseInt(this.route.snapshot.paramMap.get('id') ?? '', 10);
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.tournamentId = id;
    this.load(true);
    // Connexion WebSocket réservée au navigateur : window.location n'existe pas côté SSR,
    // et on ne veut de toute façon pas ouvrir une vraie connexion live depuis le rendu serveur.
    if (this.isBrowser) {
      this.unsubscribeLive = this.liveUpdate.subscribeToTournament(id, () => this.load(false));
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeLive?.();
  }

  private load(initial: boolean): void {
    this.tournamentService.getById(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
        this.titleService.setTitle(`${tournament.name} — Tournoi Center`);
        this.metaService.updateTag({
          name: 'description',
          content: `${tournament.name} (${tournament.sport}) — ${tournament.location?.trim() || 'lieu à venir'}, du ${formatDateFr(tournament.startDate)} au ${formatDateFr(tournament.endDate)}. Suivez le classement et les scores en direct.`,
        });
        setJsonLd(this.document, {
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: tournament.name,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: tournament.location?.trim()
            ? { '@type': 'Place', name: tournament.location }
            : undefined,
          url: `${this.document.location.origin}/t/${tournament.id}`,
        });
        if (initial && this.auth.isAuthenticated()) {
          this.loadFollowedState(tournament);
          this.tournamentService.recordView(this.tournamentId).subscribe({ error: () => {} });
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

  statusLabel(status: string): string {
    return TOURNAMENT_STATUS_LABELS[status as keyof typeof TOURNAMENT_STATUS_LABELS] ?? status;
  }

  isFollowing(teamId: number): boolean {
    return this.followedTeamIds().has(teamId);
  }

  toggleFollow(teamId: number): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/register'], { queryParams: { role: 'SPECTATOR', returnUrl: this.router.url } });
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
      { label: 'Début', value: formatDateFr(t.startDate) },
      { label: 'Fin', value: formatDateFr(t.endDate) },
      { label: 'Équipes', value: String(t.teams.length) },
      { label: 'Statut', value: this.statusLabel(t.status) },
    ];
  }
}
