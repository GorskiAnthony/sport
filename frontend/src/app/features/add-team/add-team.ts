import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../core/services/team.service';
import { ToastService } from '../../core/services/toast.service';
import { Button } from '../../shared/ui/button/button';
import { FormInput } from '../../shared/ui/form-input/form-input';
import { FormSelect, FormSelectOption } from '../../shared/ui/form-select/form-select';

const CATEGORIES: FormSelectOption[] = ['U13', 'U15', 'U16', 'U17', 'U18', 'Senior'].map((c) => ({
  value: c,
  label: c,
}));

@Component({
  selector: 'app-add-team-page',
  standalone: true,
  imports: [Button, FormInput, FormSelect],
  templateUrl: './add-team.html',
})
export class AddTeamPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamService = inject(TeamService);
  private readonly toast = inject(ToastService);

  readonly categories = CATEGORIES;

  readonly name = signal('');
  readonly club = signal('');
  readonly category = signal('U15');
  readonly contact = signal('');
  readonly logo = signal('');
  readonly loading = signal(false);

  private readonly tournamentId = Number(this.route.snapshot.queryParamMap.get('tournamentId'));

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => this.logo.set((ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (!this.name().trim()) {
      this.toast.error("Le nom de l'équipe est requis.");
      return;
    }
    if (!this.tournamentId) {
      this.toast.error('Aucun tournoi sélectionné.');
      return;
    }

    this.loading.set(true);
    this.teamService
      .create({
        name: this.name(),
        club: this.club() || undefined,
        logo: this.logo() || undefined,
        category: this.category(),
        contact: this.contact() || undefined,
        tournamentId: this.tournamentId,
      })
      .subscribe({
        next: () => {
          this.toast.success(`${this.name()} ajoutée.`, 'Équipe ajoutée !');
          this.loading.set(false);
          this.router.navigate(['/dashboard/teams']);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Une erreur est survenue.', 'Erreur');
        },
      });
  }
}
