import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular/standalone';

/** Placeholder animé (shimmer natif Ionic) pendant le chargement de la liste de tournois — même
 *  gabarit que shared/ui/tournament-card, pour que l'apparition du contenu réel ne "saute" pas. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tournament-card-skeleton',
  standalone: true,
  templateUrl: './tournament-card-skeleton.html',
  styleUrls: ['./tournament-card-skeleton.scss'],
  imports: [IonSkeletonText],
})
export class TournamentCardSkeletonComponent {}
