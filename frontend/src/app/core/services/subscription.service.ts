import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PlanTier = 'classic' | 'pro';

interface CheckoutUrlResponse {
  url: string;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/subscriptions`;

  checkout(plan: PlanTier): Observable<CheckoutUrlResponse> {
    return this.http.post<CheckoutUrlResponse>(`${this.baseUrl}/checkout`, { plan });
  }

  portal(): Observable<CheckoutUrlResponse> {
    return this.http.post<CheckoutUrlResponse>(`${this.baseUrl}/portal`, {});
  }
}
