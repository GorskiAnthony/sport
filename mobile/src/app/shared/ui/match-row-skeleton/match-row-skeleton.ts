import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular/standalone';

/** Placeholder animé (shimmer natif Ionic) pendant le chargement d'une liste de matchs — même
 *  gabarit que shared/ui/match-row, pour que l'apparition du contenu réel ne "saute" pas. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-match-row-skeleton',
  standalone: true,
  templateUrl: './match-row-skeleton.html',
  styleUrls: ['./match-row-skeleton.scss'],
  imports: [IonSkeletonText],
})
export class MatchRowSkeletonComponent {}
