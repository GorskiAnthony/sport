import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLink {
  label: string;
  href: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
})
export class Footer {
  readonly plateforme: FooterLink[] = [
    { label: 'Tournois', href: '/tournaments' },
    { label: 'Organisateurs', href: '/organizers' },
    { label: 'Tarifs', href: '/pricing' },
  ];

  readonly ressources: FooterLink[] = [
    { label: 'Aide', href: '#aide' },
    { label: 'Guide utilisateur', href: '#guide' },
    { label: 'Blog', href: '#blog' },
    { label: 'Contact', href: '#contact' },
  ];

  readonly legal: FooterLink[] = [
    { label: "Conditions d'utilisation", href: '#cgu' },
    { label: 'Politique de confidentialité', href: '#confidentialite' },
    { label: 'Mentions légales', href: '#mentions-legales' },
  ];
}
