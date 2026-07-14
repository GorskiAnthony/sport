import { Component } from '@angular/core';

interface FooterLink {
  label: string;
  href: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
})
export class Footer {
  readonly plateforme: FooterLink[] = [
    { label: 'Mes tournois', href: '#mes-tournois' },
    { label: 'Équipes', href: '#equipes' },
    { label: 'Organisateurs', href: '#organisateurs' },
    { label: 'Tarifs', href: '#tarifs' },
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
