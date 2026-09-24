import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toDataURL } from 'qrcode';
import { TournamentService } from '../../core/services/tournament.service';
import { LiveUpdateService } from '../../core/services/live-update.service';
import { TournamentDetail } from '../../core/models/tournament.model';
import { Match } from '../../core/models/match.model';
import { Team } from '../../core/models/team.model';
import { computeStandings, Standing } from '../../shared/utils/standings';
import { tournamentShareSlug } from '../../shared/utils/slug';
import { SportIcon } from '../../shared/ui/sport-icon/sport-icon';
import { GroupStandings, StandingsGroup } from '../../shared/ui/group-standings/group-standings';
import { BracketTree } from '../../shared/ui/bracket-tree/bracket-tree';

type Slide = 'live' | 'standings' | 'bracket';

const GROUP_PHASE_PREFIX = 'Groupe ';
const ROTATION_MS = 12_000;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tv-tournament-page',
  standalone: true,
  imports: [RouterLink, DatePipe, SportIcon, GroupStandings, BracketTree],
  templateUrl: './tv-tournament.html',
  styleUrl: './tv-tournament.scss',
})
export class TvTournamentPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly liveUpdate = inject(LiveUpdateService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private tournamentId = 0;
  private unsubscribeLive: (() => void) | null = null;
  private rotationTimer: ReturnType<typeof setInterval> | null = null;
  private clockTimer: ReturnType<typeof setInterval> | null = null;

  readonly tournament = signal<TournamentDetail | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly slideIndex = signal(0);
  readonly now = signal(new Date());
  readonly qrDataUrl = signal<string | null>(null);
  readonly shareUrl = computed(() => {
    const t = this.tournament();
    if (!t || typeof window === 'undefined') return '';
    return `${window.location.origin}/t/${tournamentShareSlug(t.id, t.name)}`;
  });

  readonly ongoingMatches = computed<Match[]>(() =>
    (this.tournament()?.matches ?? []).filter((m) => m.status === 'ONGOING'),
  );

  readonly upcomingMatches = computed<Match[]>(() =>
    (this.tournament()?.matches ?? [])
      .filter((m) => m.status === 'SCHEDULED')
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .slice(0, 6),
  );

  readonly knockoutMatches = computed<Match[]>(() =>
    (this.tournament()?.matches ?? []).filter((m) => !m.phase?.startsWith(GROUP_PHASE_PREFIX)),
  );

  /** Only teams appearing in a knockout-phase match — see bracket-tree.ts, which treats any
   *  team absent from round-1 matches as a bye. */
  readonly qualifiedTeams = computed<Team[]>(() => {
    const t = this.tournament();
    if (!t) return [];
    const ids = new Set<number>();
    this.knockoutMatches().forEach((m) => { ids.add(m.homeTeam.id); ids.add(m.awayTeam.id); });
    return t.teams.filter((team) => ids.has(team.id));
  });

  readonly groupPhases = computed<StandingsGroup[]>(() => {
    const t = this.tournament();
    if (!t) return [];
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

  readonly standingsRows = computed<Standing[]>(() => {
    const t = this.tournament();
    if (!t || t.format === 'GROUP_KNOCKOUT') return [];
    return computeStandings(t);
  });

  readonly slides = computed<Slide[]>(() => {
    const t = this.tournament();
    if (!t) return ['live'];

    const slides: Slide[] = ['live'];
    if (t.format === 'GROUP_KNOCKOUT') {
      if (this.groupPhases().length > 0) slides.push('standings');
      if (this.knockoutMatches().length > 0) slides.push('bracket');
    } else if (t.format === 'SINGLE_ELIMINATION') {
      if (t.matches.length > 0) slides.push('bracket');
    } else if (t.matches.length > 0) {
      slides.push('standings');
    }
    return slides;
  });

  readonly currentSlide = computed<Slide>(() => {
    const slides = this.slides();
    return slides[Math.min(this.slideIndex(), slides.length - 1)] ?? 'live';
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }
    this.tournamentId = id;
    this.load(true);
  }

  ngOnDestroy(): void {
    this.unsubscribeLive?.();
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.advance(1);
    } else if (event.key === 'ArrowLeft') {
      this.advance(-1);
    }
  }

  private advance(direction: 1 | -1): void {
    const count = this.slides().length;
    this.slideIndex.update((i) => (i + direction + count) % count);
    this.restartRotation();
  }

  private restartRotation(): void {
    if (!this.isBrowser) return;
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    this.rotationTimer = setInterval(() => this.advance(1), ROTATION_MS);
  }

  private load(initial: boolean): void {
    this.tournamentService.getById(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);

        if (initial && this.isBrowser && tournament.tvModeEnabled) {
          this.unsubscribeLive = this.liveUpdate.subscribeToTournament(this.tournamentId, () => this.load(false));
          this.restartRotation();
          this.clockTimer = setInterval(() => this.now.set(new Date()), 1000);
          toDataURL(this.shareUrl(), { margin: 1, width: 200 })
            .then((dataUrl) => this.qrDataUrl.set(dataUrl))
            .catch(() => this.qrDataUrl.set(null));
        }
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  winnerTeamId(match: Match): number | null {
    if (match.status === 'FORFEIT') {
      return match.forfeitedTeamId === match.homeTeam.id ? match.awayTeam.id : match.homeTeam.id;
    }
    if (match.homeScore === null || match.awayScore === null || match.homeScore === match.awayScore) return null;
    return match.homeScore > match.awayScore ? match.homeTeam.id : match.awayTeam.id;
  }
}
