import { Component, ElementRef, Injector, OnChanges, OnDestroy, ViewChild, afterNextRender, inject, input, signal } from '@angular/core';
import * as L from 'leaflet';
import { GeocodingService } from '../../../core/services/geocoding.service';

type MapState = 'loading' | 'ready' | 'unavailable';

@Component({
  selector: 'app-tournament-map',
  standalone: true,
  templateUrl: './tournament-map.html',
})
export class TournamentMap implements OnChanges, OnDestroy {
  readonly location = input.required<string | null>();

  @ViewChild('mapEl') private readonly mapEl?: ElementRef<HTMLDivElement>;

  private readonly geocoding = inject(GeocodingService);
  private readonly injector = inject(Injector);

  readonly state = signal<MapState>('loading');
  readonly precise = signal(true);

  private map: L.Map | null = null;
  private lastQuery: string | null = null;

  ngOnChanges(): void {
    const query = this.location()?.trim() ?? '';
    if (query === this.lastQuery) return;
    this.lastQuery = query;

    this.map?.remove();
    this.map = null;

    if (!query) {
      this.state.set('unavailable');
      return;
    }

    this.state.set('loading');
    this.geocoding.geocode(query).then((point) => {
      if (this.lastQuery !== query) return; // location() changed again while awaiting
      if (!point) {
        this.state.set('unavailable');
        return;
      }
      this.precise.set(point.precise);
      this.state.set('ready');
      afterNextRender(() => this.renderMap(point.lat, point.lon, point.precise), { injector: this.injector });
    });
  }

  private renderMap(lat: number, lon: number, precise: boolean): void {
    if (!this.mapEl) return;

    this.map = L.map(this.mapEl.nativeElement, {
      center: [lat, lon],
      zoom: precise ? 15 : 12,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(this.map);

    const icon = L.divIcon({
      className: '',
      html: '<span class="block w-4 h-4 rounded-full bg-green-500 border-[3px] border-[#0D1117] shadow-[0_0_0_3px_rgba(34,197,94,0.35)]"></span>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([lat, lon], { icon }).addTo(this.map);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
