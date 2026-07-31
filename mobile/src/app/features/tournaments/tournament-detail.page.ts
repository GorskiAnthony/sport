import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonText,
  IonSpinner,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  addOutline,
  checkmarkOutline,
  closeOutline,
  eyeOutline,
  qrCodeOutline,
  alertCircleOutline,
  calendarOutline,
} from 'ionicons/icons';
import { TournamentService } from '../../core/services/tournament.service';
import { TeamService } from '../../core/services/team.service';
import { BracketService } from '../../core/services/bracket.service';
import { TournamentDetail, TournamentFormat } from '../../core/models/tournament.model';
import { Match } from '../../core/models/match.model';
import { Team } from '../../core/models/team.model';
import { FormatPicker } from '../../shared/ui/format-picker/format-picker';
import { BreadcrumbComponent, BreadcrumbSegment } from '../../shared/ui/breadcrumb/breadcrumb';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { MatchRowComponent } from '../../shared/ui/match-row/match-row';
import { computeStandings, Standing } from '../../shared/utils/standings';
import { groupMatchesIntoRounds, Round } from '../../shared/utils/rounds';
import { TOURNAMENT_STATUS_COLORS, TOURNAMENT_STATUS_LABELS } from '../../shared/utils/tournament-status';

const GROUP_PHASE_PREFIX = 'Groupe ';

interface GroupPhase {
  label: string;
  teams: Team[];
  matches: Match[];
}

const TEAM_CATEGORIES = ['U13', 'U15', 'U16', 'U17', 'U18', 'Senior'];

/** Portage mobile de frontend/src/app/features/dashboard/tournament-detail/tournament-detail.ts
 *  — même branchement par format, mais avec une liste de tours simplifiée à la place du
 *  BracketTree graphique (ne tiendrait pas sur un écran de téléphone), un classement empilé au
 *  lieu d'un tableau large, et la gestion des équipes intégrée ici plutôt que sur un écran à
 *  part (voir le plan de portage). */
@Component({
  selector: 'app-tournament-detail',
  templateUrl: './tournament-detail.page.html',
  styleUrls: ['./tournament-detail.page.scss'],
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonText,
    IonSpinner,
    FormatPicker,
    StatusBadgeComponent,
    EmptyStateComponent,
    MatchRowComponent,
    BreadcrumbComponent,
  ],
})
export class TournamentDetailPage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly teamService = inject(TeamService);
  private readonly bracketService = inject(BracketService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  tournamentId!: number;

  readonly teamCategories = TEAM_CATEGORIES;

  readonly tournament = signal<TournamentDetail | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly breadcrumbSegments = computed<BreadcrumbSegment[]>(() => {
    const t = this.tournament();
    if (!t) return [{ label: 'Tournoi' }];
    return [{ label: 'Tournois', route: ['/tournaments'] }, { label: t.name }];
  });

  readonly chosenFormat = signal<TournamentFormat | null>(null);
  readonly groupCount = signal('4');
  readonly generating = signal(false);
  readonly advancing = signal(false);
  readonly deleting = signal(false);

  readonly addingTeam = signal(false);
  readonly editingTeamId = signal<number | null>(null);
  readonly teamName = signal('');
  readonly teamCategory = signal('U15');
  readonly teamError = signal<string | null>(null);
  readonly savingTeam = signal(false);

  readonly knockoutMatches = computed<Match[]>(() =>
    (this.tournament()?.matches ?? []).filter((m) => !m.phase?.startsWith(GROUP_PHASE_PREFIX)),
  );

  readonly groupPhases = computed<GroupPhase[]>(() => {
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
      matches.forEach((m) => {
        teamIds.add(m.homeTeam.id);
        teamIds.add(m.awayTeam.id);
      });
      return { label, teams: t.teams.filter((team) => teamIds.has(team.id)), matches };
    });
  });

  readonly roundPlanningGroups = computed<GroupPhase[]>(() => {
    const t = this.tournament();
    if (!t || t.format !== 'ROUND_ROBIN') return [];
    return [{ label: 'Poule unique', teams: t.teams, matches: t.matches }];
  });

  readonly standings = computed<Standing[]>(() => {
    const t = this.tournament();
    return t ? computeStandings(t) : [];
  });

  constructor() {
    addIcons({ createOutline, trashOutline, addOutline, checkmarkOutline, closeOutline, eyeOutline, qrCodeOutline, alertCircleOutline, calendarOutline });
  }

  ionViewWillEnter(): void {
    this.tournamentId = Number(this.route.snapshot.paramMap.get('id'));
    this.cancelTeamEdit();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.tournamentService.getById(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  statusLabel(status: TournamentDetail['status']): string {
    return TOURNAMENT_STATUS_LABELS[status];
  }

  statusColor(status: TournamentDetail['status']): 'primary' | 'warning' | 'danger' | 'medium' {
    return TOURNAMENT_STATUS_COLORS[status];
  }

  roundsFor(matches: Match[], teams: Team[]): Round[] {
    return groupMatchesIntoRounds(matches, teams);
  }

  standingsFor(group: GroupPhase): Standing[] {
    return computeStandings(group);
  }

  onGroupCountInput(value: string | null | undefined): void {
    this.groupCount.set(value ?? '4');
  }

  generateBracket(): void {
    const format = this.chosenFormat();
    if (!format) return;

    const groupCount = format === 'GROUP_KNOCKOUT' ? Number(this.groupCount()) : undefined;
    this.generating.set(true);
    this.bracketService.generate(this.tournamentId, format, groupCount).subscribe({
      next: () => {
        this.generating.set(false);
        void this.showToast('Le tableau a été généré.', 'success');
        this.load();
      },
      error: () => {
        this.generating.set(false);
        void this.showToast('Une erreur est survenue lors de la génération.', 'danger');
      },
    });
  }

  advanceRound(): void {
    this.advancing.set(true);
    this.bracketService.advance(this.tournamentId).subscribe({
      next: (result) => {
        this.advancing.set(false);
        if (result.tournamentComplete) {
          void this.showToast(`🏆 Champion : ${result.champion?.name ?? '—'}`, 'success');
        } else {
          void this.showToast('Le tour suivant a été généré.', 'success');
        }
        this.load();
      },
      error: () => {
        this.advancing.set(false);
        void this.showToast("Le tour en cours n'est pas terminé ou une erreur est survenue.", 'danger');
      },
    });
  }

  async confirmDeleteTournament(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Supprimer ce tournoi ?',
      message: 'Cette action est définitive : le tournoi, ses équipes et ses matchs seront supprimés.',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Supprimer', role: 'confirm', handler: () => this.deleteTournament() },
      ],
    });
    await alert.present();
  }

  private deleteTournament(): void {
    this.deleting.set(true);
    this.tournamentService.delete(this.tournamentId).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/tournaments']);
      },
      error: () => {
        this.deleting.set(false);
        void this.showToast('Une erreur est survenue lors de la suppression.', 'danger');
      },
    });
  }

  startAddTeam(): void {
    this.addingTeam.set(true);
    this.editingTeamId.set(null);
    this.teamName.set('');
    this.teamCategory.set('U15');
    this.teamError.set(null);
  }

  startEditTeam(team: Team): void {
    this.editingTeamId.set(team.id);
    this.addingTeam.set(false);
    this.teamName.set(team.name);
    this.teamCategory.set(team.category);
    this.teamError.set(null);
  }

  cancelTeamEdit(): void {
    this.addingTeam.set(false);
    this.editingTeamId.set(null);
  }

  onTeamNameInput(value: string | null | undefined): void {
    this.teamName.set(value ?? '');
  }

  onTeamCategoryChange(value: string | null | undefined): void {
    this.teamCategory.set(value ?? 'U15');
  }

  saveTeam(): void {
    if (this.savingTeam()) return;
    if (!this.teamName().trim()) {
      this.teamError.set('Requis.');
      return;
    }
    this.teamError.set(null);
    this.savingTeam.set(true);

    const editingId = this.editingTeamId();
    const request$ = editingId
      ? this.teamService.update(editingId, { name: this.teamName(), category: this.teamCategory() })
      : this.teamService.create({ name: this.teamName(), category: this.teamCategory(), tournamentId: this.tournamentId });

    request$.subscribe({
      next: () => {
        this.savingTeam.set(false);
        this.cancelTeamEdit();
        this.load();
      },
      error: (err: { error?: { message?: string } }) => {
        this.savingTeam.set(false);
        void this.showToast(err.error?.message ?? "Une erreur est survenue lors de l'enregistrement de l'équipe.", 'danger');
      },
    });
  }

  async confirmDeleteTeam(team: Team): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Supprimer cette équipe ?',
      message: `${team.name} sera retirée du tournoi.`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Supprimer', role: 'confirm', handler: () => this.deleteTeam(team.id) },
      ],
    });
    await alert.present();
  }

  private deleteTeam(id: number): void {
    this.teamService.delete(id).subscribe({
      next: () => this.load(),
      error: () => void this.showToast("Une erreur est survenue lors de la suppression de l'équipe.", 'danger'),
    });
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}
