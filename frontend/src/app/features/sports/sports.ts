import { Component } from '@angular/core';
import { PageHeader } from '../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-sports-page',
  standalone: true,
  imports: [PageHeader],
  templateUrl: './sports.html',
})
export class SportsPage {
  readonly sports = [
    { id: 'football', label: 'Football', icon: '⚽', count: 1240 },
    { id: 'basketball', label: 'Basketball', icon: '🏀', count: 380 },
    { id: 'tennis', label: 'Tennis', icon: '🎾', count: 210 },
    { id: 'volleyball', label: 'Volleyball', icon: '🏐', count: 175 },
    { id: 'rugby', label: 'Rugby', icon: '🏉', count: 145 },
    { id: 'esport', label: 'Esport', icon: '🎮', count: 220 },
    { id: 'handball', label: 'Handball', icon: '🤾', count: 130 },
    { id: 'futsal', label: 'Futsal', icon: '⚽', count: 90 },
  ];
}
