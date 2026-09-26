import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { setPageMeta, setCanonical } from '../../../shared/utils/seo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confidentialite-page',
  standalone: true,
  imports: [PageHeader],
  templateUrl: './confidentialite.html',
})
export class ConfidentialitePage {
  constructor() {
    const document = inject(DOCUMENT);
    const url = `${document.location.origin}/confidentialite`;
    setPageMeta(inject(Title), inject(Meta), {
      title: 'Politique de confidentialité',
      description: 'Comment Matchday collecte, utilise et protège vos données personnelles.',
      url,
    });
    setCanonical(document, url);
  }
}
