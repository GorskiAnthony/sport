import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { setPageMeta, setCanonical } from '../../../shared/utils/seo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cgu-page',
  standalone: true,
  imports: [PageHeader, RouterLink],
  templateUrl: './cgu.html',
})
export class CguPage {
  constructor() {
    const document = inject(DOCUMENT);
    const url = `${document.location.origin}/cgu`;
    setPageMeta(inject(Title), inject(Meta), {
      title: "Conditions générales d'utilisation",
      description: "Conditions générales d'utilisation du service Matchday : compte, abonnements et résiliation.",
      url,
    });
    setCanonical(document, url);
  }
}
