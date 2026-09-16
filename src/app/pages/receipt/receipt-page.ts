import { Component, computed, inject } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, map, of, switchMap } from 'rxjs';

import { ApiError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { LOCATION_LABELS, formatMoney, itemNumber, itemSymbol } from '../../core/format';
import { LoadState, parseId, toLoadState } from '../../core/load-state';
import { OrderReceipt } from '../../core/models';
import { ErrorState } from '../../shared/error-state/error-state';

const INVALID_ID: LoadState<OrderReceipt> = {
  status: 'error',
  error: new ApiError(404, 'invalid_id', 'This receipt link looks invalid.'),
};

/**
 * Money comes from the order's own snapshot (unit_price, total_price,
 * currency) — never the live product, so later price edits can't rewrite history.
 */
@Component({
  selector: 'app-receipt-page',
  imports: [RouterLink, DatePipe, UpperCasePipe, ErrorState],
  templateUrl: './receipt-page.html',
  styleUrl: './receipt-page.css',
})
export class ReceiptPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly retry$ = new BehaviorSubject<void>(undefined);

  protected readonly justPurchased = this.readJustPurchased();

  protected readonly state = toSignal(
    combineLatest([this.route.paramMap.pipe(map((p) => parseId(p.get('orderId')))), this.retry$]).pipe(
      switchMap(([id]) => (id === null ? of(INVALID_ID) : toLoadState(this.api.getOrder(id)))),
    ),
    { initialValue: { status: 'loading' } as LoadState<OrderReceipt> },
  );

  protected readonly view = computed(() => {
    const s = this.state();
    if (s.status !== 'ready') return null;
    const order = s.data;
    return {
      order,
      symbol: itemSymbol(order.product.title),
      number: itemNumber(order.product.id),
      locationLabel: LOCATION_LABELS[order.product.location],
      unitPrice: formatMoney(order.unit_price),
      total: formatMoney(order.total_price),
    };
  });

  protected print(): void {
    window.print();
  }

  protected retry(): void {
    this.retry$.next();
  }

  private readJustPurchased(): boolean {
    const state: unknown = history.state;
    return typeof state === 'object' && state !== null && 'justPurchased' in state && state.justPurchased === true;
  }
}
