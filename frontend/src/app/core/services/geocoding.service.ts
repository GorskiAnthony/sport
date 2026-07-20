import { Injectable } from '@angular/core';

export interface GeoPoint {
  lat: number;
  lon: number;
}

/**
 * Free-text -> coordinates via Nominatim (OpenStreetMap), no API key required.
 * Results are cached in memory for the tab's lifetime: Nominatim's usage policy caps
 * public requests at 1/s and asks callers to avoid repeating identical lookups.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly cache = new Map<string, GeoPoint | null>();

  async geocode(query: string): Promise<GeoPoint | null> {
    const trimmed = query.trim();
    if (!trimmed) return null;

    if (this.cache.has(trimmed)) {
      return this.cache.get(trimmed)!;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

      const results: { lat: string; lon: string }[] = await res.json();
      const point = results.length > 0 ? { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) } : null;
      this.cache.set(trimmed, point);
      return point;
    } catch {
      this.cache.set(trimmed, null);
      return null;
    }
  }
}
