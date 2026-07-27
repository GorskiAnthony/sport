import { Injectable } from '@angular/core';

export interface GeoPoint {
  lat: number;
  lon: number;
  /** false when the exact query didn't resolve and a broader fallback (postcode/city) was used instead. */
  precise: boolean;
}

/**
 * Free-text -> coordinates via Nominatim (OpenStreetMap), no API key required.
 * Results are cached in memory for the tab's lifetime: Nominatim's usage policy caps
 * public requests at 1/s and asks callers to avoid repeating identical lookups.
 *
 * Street/house-level OSM coverage is uneven, so an exact address often returns nothing.
 * geocode() degrades the query in that case (postcode + city, then just the last word)
 * so callers can still show an approximate pin instead of nothing.
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

    let point = await this.lookup(trimmed);
    if (!point) {
      for (const fallback of this.fallbackQueries(trimmed)) {
        point = await this.lookup(fallback);
        if (point) {
          point = { ...point, precise: false };
          break;
        }
      }
    }

    this.cache.set(trimmed, point);
    return point;
  }

  private fallbackQueries(query: string): string[] {
    const queries: string[] = [];

    // French postal code (5 digits) + whatever follows it, e.g. "17 rue X 13014 Marseille" -> "13014 Marseille"
    const postcodeMatch = query.match(/\b\d{5}\b.*$/);
    if (postcodeMatch) queries.push(postcodeMatch[0].trim());

    // Last word alone (usually the city) as a last resort.
    const words = query.split(/\s+/).filter(Boolean);
    const lastWord = words[words.length - 1];
    if (lastWord && !queries.includes(lastWord)) queries.push(lastWord);

    return queries;
  }

  private async lookup(query: string): Promise<GeoPoint | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

      const results: { lat: string; lon: string }[] = await res.json();
      return results.length > 0 ? { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), precise: true } : null;
    } catch {
      return null;
    }
  }
}
