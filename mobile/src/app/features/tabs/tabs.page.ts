import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline, personCircleOutline } from 'ionicons/icons';
import { hapticSelection } from '../../shared/utils/haptics';

/** Coquille de navigation par onglets pour le flux organisateur authentifié (voir
 *  .claude/skills/design-system et le plan de refonte mobile) : Tournois / Compte. Les écrans
 *  poussés par-dessus (détail, création, live, arbitrage) sont des routes sœurs au niveau
 *  racine — voir app.routes.ts — donc ils remplacent entièrement cette page et la tab bar
 *  disparaît, plutôt que de rester visible en permanence. */
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  constructor() {
    addIcons({ trophyOutline, personCircleOutline });
  }

  onTabChange(): void {
    hapticSelection();
  }
}
