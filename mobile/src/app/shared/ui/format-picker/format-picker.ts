import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { IonRadioGroup, IonRadio, IonItem, IonLabel, IonText } from '@ionic/angular/standalone';
import { TournamentFormat } from '../../../core/models/tournament.model';

interface FormatOption {
  id: TournamentFormat;
  title: string;
  description: string;
}

const OPTIONS: FormatOption[] = [
  {
    id: 'ROUND_ROBIN',
    title: 'Poule (Round Robin)',
    description: 'Chaque équipe affronte toutes les autres une fois.',
  },
  {
    id: 'SINGLE_ELIMINATION',
    title: 'Élimination directe',
    description: 'Élimination immédiate après une défaite.',
  },
  {
    id: 'GROUP_KNOCKOUT',
    title: 'Phase de groupes + Élimination',
    description: 'Poules puis élimination directe pour les qualifiés.',
  },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-format-picker',
  standalone: true,
  templateUrl: './format-picker.html',
  imports: [IonRadioGroup, IonRadio, IonItem, IonLabel, IonText],
})
export class FormatPicker {
  readonly options = OPTIONS;
  readonly value = model<TournamentFormat | null>(null);

  onChange(id: TournamentFormat): void {
    this.value.set(id);
  }
}
