import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  BuvetteProduct,
  BuvetteProductRequest,
  BuvetteSale,
  BuvetteSaleRequest,
  BuvetteSummary,
} from '../models/buvette.model';

/** Miroir de frontend/src/app/core/services/buvette.service.ts — mêmes endpoints. */
@Injectable({ providedIn: 'root' })
export class BuvetteService {
  private readonly http = inject(HttpClient);
  private readonly tournamentsUrl = `${environment.apiUrl}/tournaments`;
  private readonly buvetteUrl = `${environment.apiUrl}/buvette`;

  getProducts(tournamentId: number): Observable<BuvetteProduct[]> {
    return this.http
      .get<ApiResponse<BuvetteProduct[]>>(`${this.tournamentsUrl}/${tournamentId}/buvette/products`)
      .pipe(map((res) => res.data));
  }

  createProduct(tournamentId: number, payload: BuvetteProductRequest): Observable<BuvetteProduct> {
    return this.http
      .post<ApiResponse<BuvetteProduct>>(`${this.tournamentsUrl}/${tournamentId}/buvette/products`, payload)
      .pipe(map((res) => res.data));
  }

  updateProduct(id: number, payload: BuvetteProductRequest): Observable<BuvetteProduct> {
    return this.http
      .put<ApiResponse<BuvetteProduct>>(`${this.buvetteUrl}/products/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteProduct(id: number): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${this.buvetteUrl}/products/${id}`)
      .pipe(map((res) => res.data));
  }

  getSales(tournamentId: number): Observable<BuvetteSale[]> {
    return this.http
      .get<ApiResponse<BuvetteSale[]>>(`${this.tournamentsUrl}/${tournamentId}/buvette/sales`)
      .pipe(map((res) => res.data));
  }

  recordSale(tournamentId: number, payload: BuvetteSaleRequest): Observable<BuvetteSale> {
    return this.http
      .post<ApiResponse<BuvetteSale>>(`${this.tournamentsUrl}/${tournamentId}/buvette/sales`, payload)
      .pipe(map((res) => res.data));
  }

  deleteSale(id: number): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${this.buvetteUrl}/sales/${id}`)
      .pipe(map((res) => res.data));
  }

  getSummary(tournamentId: number): Observable<BuvetteSummary> {
    return this.http
      .get<ApiResponse<BuvetteSummary>>(`${this.tournamentsUrl}/${tournamentId}/buvette/summary`)
      .pipe(map((res) => res.data));
  }
}
