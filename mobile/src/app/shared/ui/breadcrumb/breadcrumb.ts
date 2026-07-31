import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbSegment {
  label: string;
  /** Commandes routerLink — absent sur le dernier élément (page courante, non cliquable). */
  route?: unknown[];
}

/** Fil d'Ariane compact pour les en-têtes d'écrans imbriqués (détail de tournoi, score en
 *  direct, écran arbitre...) — remplace le simple <ion-title> statique par un contexte
 *  hiérarchique navigable, à poser dans <ion-title> pour hériter de son alignement à gauche
 *  (voir .claude/skills/design-system et les pages tournaments/*, referee/match-detail). */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-breadcrumb',
  standalone: true,
  templateUrl: './breadcrumb.html',
  styleUrls: ['./breadcrumb.scss'],
  imports: [RouterLink],
})
export class BreadcrumbComponent {
  readonly segments = input.required<BreadcrumbSegment[]>();
}
