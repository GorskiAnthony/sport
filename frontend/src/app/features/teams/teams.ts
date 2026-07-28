import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { setPageMeta } from '../../shared/utils/seo';

@Component({
  selector: 'app-teams-page',
  standalone: true,
  imports: [PageHeader],
  templateUrl: './teams.html',
})
export class TeamsPage {
  constructor() {
    setPageMeta(inject(Title), inject(Meta), {
      title: 'Équipes',
      description: 'Retrouvez les équipes inscrites sur Tournoi Center, tous sports et catégories confondus.',
    });
  }

  readonly teams = [
    { id: 1, name: 'Paris FC', city: 'Paris', category: 'U15', sport: 'Football', initials: 'PFC' },
    { id: 2, name: 'OM Academy', city: 'Marseille', category: 'U15', sport: 'Football', initials: 'OMA' },
    { id: 3, name: 'FC Nantes', city: 'Nantes', category: 'U15', sport: 'Football', initials: 'FCN' },
    { id: 4, name: 'Stade Rennais', city: 'Rennes', category: 'U16', sport: 'Football', initials: 'SR' },
    { id: 5, name: 'LOSC', city: 'Lille', category: 'U17', sport: 'Football', initials: 'LSC' },
    { id: 6, name: 'OL Academy', city: 'Lyon', category: 'U16', sport: 'Football', initials: 'OLA' },
  ];
}
