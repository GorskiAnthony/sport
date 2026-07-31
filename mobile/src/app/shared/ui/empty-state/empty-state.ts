import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

/** Bloc de chargement/erreur/vide centré (icône + titre optionnel + message + action projetée),
 *  utilisé par la quasi-totalité des écrans à la place de la variante minimale ad hoc qui
 *  existait auparavant sur chaque page (voir global.scss .state-container, dont ce composant
 *  hérite la mise en page de base). Sans icône fournie, se comporte comme un simple centrage
 *  message + action (ex. état "vide" discret). */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  styleUrls: ['./empty-state.scss'],
  imports: [IonIcon],
})
export class EmptyStateComponent {
  readonly icon = input<string | undefined>(undefined);
  readonly tone = input<'primary' | 'warning' | 'danger'>('primary');
  readonly title = input<string | undefined>(undefined);
  readonly message = input.required<string>();
}
