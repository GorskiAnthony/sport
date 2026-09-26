// Miroir de frontend/src/app/core/models/buvette.model.ts — même API backend.
export interface BuvetteProduct {
  id: number;
  tournamentId: number;
  name: string;
  price: number;
}

export interface BuvetteProductRequest {
  name: string;
  price: number;
}

export interface BuvetteSaleItem {
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface BuvetteSale {
  id: number;
  tournamentId: number;
  items: BuvetteSaleItem[];
  total: number;
  createdAt: string;
}

export interface BuvetteSaleItemRequest {
  productId: number;
  quantity: number;
}

export interface BuvetteSaleRequest {
  items: BuvetteSaleItemRequest[];
}

export interface BuvetteProductSales {
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface BuvetteSummary {
  totalRevenue: number;
  saleCount: number;
  byProduct: BuvetteProductSales[];
}
