import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Plan } from '../models/user.model';
import { BillingPeriod } from '../../features/pricing/billing-toggle/billing-toggle';

export type PlanTier = 'classic' | 'pro';

interface CheckoutUrlResponse {
  url: string;
}

interface PlanChangeResponse {
  plan: Plan;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/subscriptions`;

  checkout(plan: PlanTier, period: BillingPeriod): Observable<CheckoutUrlResponse> {
    return this.http.post<CheckoutUrlResponse>(`${this.baseUrl}/checkout`, { plan, period });
  }

  changePlan(plan: PlanTier, period: BillingPeriod): Observable<PlanChangeResponse> {
    return this.http.post<PlanChangeResponse>(`${this.baseUrl}/change-plan`, { plan, period });
  }

  portal(): Observable<CheckoutUrlResponse> {
    return this.http.post<CheckoutUrlResponse>(`${this.baseUrl}/portal`, {});
  }
}
