import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { PUBLIC_ENDPOINT } from './auth.interceptor';
import {
  CreateOrderRequest,
  LoginRequest,
  OrderReceipt,
  Paginated,
  Product,
  ProductQuery,
  TokenResponse,
  User,
} from './models';

/**
 * All network calls go through here. Bearer auth and error normalisation
 * happen in authInterceptor, so every method returns either the typed body
 * or an ApiError.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  login(body: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/auth/login`, body, {
      context: new HttpContext().set(PUBLIC_ENDPOINT, true),
    });
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/me`);
  }

  /** Sends only the params that are set, so a bare list uses the backend defaults. */
  listProducts(query: ProductQuery): Observable<Paginated<Product>> {
    let params = new HttpParams();
    if (query.page !== undefined && query.page > 1) {
      params = params.set('page', query.page);
    }
    if (query.location !== undefined) params = params.set('location', query.location);
    if (query.sort !== undefined && query.sort !== 'id_asc') params = params.set('sort', query.sort);
    return this.http.get<Paginated<Product>>(`${this.baseUrl}/products`, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`);
  }

  createOrder(body: CreateOrderRequest): Observable<OrderReceipt> {
    return this.http.post<OrderReceipt>(`${this.baseUrl}/orders`, body);
  }

  /** 404 (not 403) when the order belongs to someone else. */
  getOrder(id: number): Observable<OrderReceipt> {
    return this.http.get<OrderReceipt>(`${this.baseUrl}/orders/${id}`);
  }
}
