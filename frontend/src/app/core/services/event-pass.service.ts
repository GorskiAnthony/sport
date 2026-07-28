import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface CheckoutUrlResponse {
  url: string;
}

interface EventPassCreditsResponse {
  available: boolean;
}

@Injectable({ providedIn: 'root' })
export class EventPassService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/event-pass`;

  checkout(): Observable<CheckoutUrlResponse> {
    return this.http.post<CheckoutUrlResponse>(`${this.baseUrl}/checkout`, {});
  }

  credits(): Observable<EventPassCreditsResponse> {
    return this.http.get<EventPassCreditsResponse>(`${this.baseUrl}/credits`);
  }
}
