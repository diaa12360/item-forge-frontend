/**
 * API types, mirrored from the backend's /openapi.json.
 *
 * MONEY IS A STRING. The backend serializes NUMERIC(10,2) through Decimal,
 * never a float. Never type a price as `number` and never parseFloat it for
 * display — format the string (see format.ts).
 */
export type Money = string;

export type Location = 'JO' | 'SA';

export type Currency = 'JOD' | 'SAR';

export type ProductSort = 'id_asc' | 'price_asc' | 'price_desc' | 'title_asc';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: Money;
  location: Location;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ProductQuery {
  page?: number;
  location?: Location;
  sort?: ProductSort;
}

export interface CreateOrderRequest {
  product_id: number;
}

/** The product snapshot on a receipt has no price: the money lives on the order. */
export interface OrderProductSnapshot {
  id: number;
  title: string;
  description: string;
  location: Location;
}

export interface OrderReceipt {
  id: number;
  order_reference: string;
  status: string;
  created_at: string;
  buyer_username: string;
  product: OrderProductSnapshot;
  unit_price: Money;
  quantity: number;
  total_price: Money;
  currency: Currency;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  request_id: string;
}
