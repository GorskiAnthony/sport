import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { setPageMeta, setCanonical } from '../../../shared/utils/seo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mentions-legales-page',
  standalone: true,
  imports: [PageHeader],
  templateUrl: './mentions-legales.html',
})
export class MentionsLegalesPage {
  constructor() {
    const document = inject(DOCUMENT);
    const url = `${document.location.origin}/mentions-legales`;
    setPageMeta(inject(Title), inject(Meta), {
      title: 'Mentions légales',
      description: 'Éditeur, hébergeur et informations légales du site Matchday.',
      url,
    });
    setCanonical(document, url);
  }
}
