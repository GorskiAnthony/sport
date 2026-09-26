import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentSummary } from '../../core/models/tournament.model';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { TOURNAMENT_STATUS_LABELS } from '../../shared/utils/labels';
import { StatusBadge } from '../../shared/ui/status-badge/status-badge';
import { SportIcon } from '../../shared/ui/sport-icon/sport-icon';
import { SPORTS } from '../../shared/utils/sports';
import { setPageMeta, setCanonical } from '../../shared/utils/seo';

const PAGE_SIZES = [25, 50, 75, 100] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tournaments-page',
  standalone: true,
  imports: [RouterLink, PageHeader, StatusBadge, SportIcon],
  templateUrl: './tournaments.html',
})
export class TournamentsPage implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private searchTimeout?: ReturnType<typeof setTimeout>;

  readonly tournaments = signal<TournamentSummary[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly sport = signal('');
  readonly page = signal(0);
  readonly pageSize = signal<(typeof PAGE_SIZES)[number]>(25);
  readonly totalCount = signal(0);
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  readonly pageSizes = PAGE_SIZES;
  readonly sports = SPORTS;

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));

  constructor() {
    const url = this.document.location.origin + '/tournaments';
    setPageMeta(inject(Title), inject(Meta), {
      title: 'Tournois',
      description: 'Parcourez les tournois sportifs organisés sur Matchday : dates, lieux, équipes et classements en direct.',
      url,
      image: `${this.document.location.origin}/football-stadium-sunset.webp`,
    });
    // Canonical fixe sur l'URL sans paramètres : une recherche/filtre ne doit pas être indexée
    // comme une page distincte de la liste des tournois (contenu quasi-identique, juste filtré).
    setCanonical(this.document, url);
  }

  ngOnInit(): void {
    // Recherche reflétée dans l'URL (?search=) : rend les recherches partageables/bookmarkables,
    // et permet au JSON-LD WebSite (voir PublicLayout) de déclarer un vrai SearchAction plutôt
    // qu'une capacité qui n'existerait pas.
    const params = this.route.snapshot.queryParamMap;
    this.search.set(params.get('search') ?? '');
    this.sport.set(params.get('sport') ?? '');
    this.load();
  }

  private syncQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: this.search() || null, sport: this.sport() || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(0);
      this.syncQueryParams();
      this.load();
    }, 300);
  }

  onSportChange(event: Event): void {
    this.sport.set((event.target as HTMLSelectElement).value);
    this.page.set(0);
    this.syncQueryParams();
    this.load();
  }

  onPageSizeChange(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value) as (typeof PAGE_SIZES)[number]);
    this.page.set(0);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.tournamentService
      .searchPaged({ search: this.search(), sport: this.sport(), page: this.page(), size: this.pageSize() })
      .subscribe({
        next: ({ items, totalCount }) => {
          this.tournaments.set(items);
          this.totalCount.set(totalCount);
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
}
