import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, UrlTree } from '@angular/router';
import { BehaviorSubject, combineLatest, firstValueFrom, map, of, switchMap } from 'rxjs';

import { ApiError, errorMessage } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { LOCATION_LABELS, currencyFor, formatMoney, itemImageUrl, itemNumber } from '../../core/format';
import { LoadState, parseId, toLoadState } from '../../core/load-state';
import { Product } from '../../core/models';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { ErrorState } from '../../shared/error-state/error-state';

/** A route id that can't be a product never fires a request. */
const INVALID_ID: LoadState<Product> = {
  status: 'error',
  error: new ApiError(404, 'invalid_id', 'This product link looks invalid.'),
};

@Component({
  selector: 'app-product-details-page',
  imports: [RouterLink, DatePipe, UpperCasePipe, ConfirmDialog, ErrorState],
  templateUrl: './product-details-page.html',
  styleUrl: './product-details-page.css',
})
export class ProductDetailsPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly retry$ = new BehaviorSubject<void>(undefined);

  protected readonly backTo: string = this.readBackTo();
  /** routerLink treats a string as one literal path segment, so a query string
   * in it (e.g. "/products?location=JO") gets percent-encoded instead of
   * parsed — bind the parsed tree instead. */
  protected readonly backToUrl: UrlTree = this.router.parseUrl(this.backTo);

  protected readonly state = toSignal(
    combineLatest([this.route.paramMap.pipe(map((p) => parseId(p.get('id')))), this.retry$]).pipe(
      switchMap(([id]) => (id === null ? of(INVALID_ID) : toLoadState(this.api.getProduct(id)))),
    ),
    { initialValue: { status: 'loading' } as LoadState<Product> },
  );

  protected readonly view = computed(() => {
    const s = this.state();
    if (s.status !== 'ready') return null;
    const p = s.data;
    return {
      product: p,
      number: itemNumber(p.id),
      image: itemImageUrl(p.id, 800, 640),
      price: formatMoney(p.price),
      currency: currencyFor(p.location),
      locationLabel: LOCATION_LABELS[p.location],
    };
  });

  protected readonly dialogOpen = signal(false);
  protected readonly purchasing = signal(false);
  protected readonly purchaseError = signal<string | null>(null);
  /** Synchronous double-submit guard: set before the first await, never batched. */
  private submitting = false;

  protected openDialog(): void {
    this.purchaseError.set(null);
    this.dialogOpen.set(true);
  }

  protected closeDialog(): void {
    if (!this.purchasing()) this.dialogOpen.set(false);
  }

  protected async confirmPurchase(): Promise<void> {
    const product = this.view()?.product;
    if (this.submitting || product === undefined) return;
    this.submitting = true;
    this.purchasing.set(true);
    this.purchaseError.set(null);

    try {
      const order = await firstValueFrom(this.api.createOrder({ product_id: product.id }));
      // Leave the guard set: the page is navigating away.
      await this.router.navigate(['/receipt', order.id], { state: { justPurchased: true } });
    } catch (error) {
      this.submitting = false;
      this.purchasing.set(false);
      this.purchaseError.set(errorMessage(error, 'Something went wrong placing your order. Please try again.'));
    }
  }

  protected retry(): void {
    this.retry$.next();
  }

  /** Router state lands in history.state, so it also survives a refresh. */
  private readBackTo(): string {
    const state: unknown = history.state;
    const backTo =
      typeof state === 'object' && state !== null && 'backTo' in state ? (state as { backTo: unknown }).backTo : null;
    return typeof backTo === 'string' && backTo.startsWith('/products') ? backTo : '/products';
  }
}
