import { Component } from '@angular/core';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Button } from '../../shared/ui/button/button';

@Component({
  selector: 'app-organizers-page',
  standalone: true,
  imports: [PageHeader, Button],
  templateUrl: './organizers.html',
})
export class OrganizersPage {
  readonly steps = [
    { n: 1, title: 'Créez votre compte', desc: "Inscrivez-vous gratuitement en moins de 2 minutes." },
    { n: 2, title: 'Créez votre tournoi', desc: 'Renseignez les infos : sport, catégorie, dates, lieu, format.' },
    { n: 3, title: 'Ajoutez vos équipes', desc: 'Importez ou ajoutez manuellement les équipes participantes.' },
    { n: 4, title: 'Gérez en direct', desc: 'Saisissez les scores, le classement se met à jour tout seul.' },
  ];
}
