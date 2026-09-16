import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, switchMap } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { LoadState, toLoadState } from '../../core/load-state';
import { Location, Paginated, Product, ProductQuery, ProductSort } from '../../core/models';
import { ErrorState } from '../../shared/error-state/error-state';
import { Pagination } from '../../shared/pagination/pagination';
import { ProductCard } from '../../shared/product-card/product-card';
import { SkeletonCard } from '../../shared/skeleton-card/skeleton-card';

const LOCATIONS: readonly { value: Location | null; label: string; short: string }[] = [
  { value: null, label: 'All', short: 'All' },
  { value: 'JO', label: 'Jordan · JO', short: 'JO' },
  { value: 'SA', label: 'Saudi · SA', short: 'SA' },
];

const SORTS: readonly { value: ProductSort; label: string }[] = [
  { value: 'id_asc', label: 'Default' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'title_asc', label: 'Name A–Z' },
];

function readQuery(params: ParamMap): ProductQuery {
  const rawPage = params.get('page');
  const page = rawPage !== null && /^[1-9][0-9]{0,5}$/.test(rawPage) ? Number(rawPage) : 1;
  const rawLocation = params.get('location');
  const location = rawLocation === 'JO' || rawLocation === 'SA' ? rawLocation : undefined;
  const sort = SORTS.find((s) => s.value === params.get('sort'))?.value;
  return { page, location, sort };
}

function sameQuery(a: ProductQuery, b: ProductQuery): boolean {
  return a.page === b.page && a.location === b.location && a.sort === b.sort;
}

/**
 * Page, location and sort live in the query string. Each URL change starts a
 * new request and switchMap cancels the previous one, so fast clicks cannot
 * paint a stale page.
 */
@Component({
  selector: 'app-products-page',
  imports: [ProductCard, SkeletonCard, Pagination, ErrorState],
  templateUrl: './products-page.html',
  styleUrl: './products-page.css',
})
export class ProductsPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly retry$ = new BehaviorSubject<void>(undefined);

  protected readonly locations = LOCATIONS;
  protected readonly sorts = SORTS;
  protected readonly skeletons = Array.from({ length: 12 }, (_, i) => i);

  private readonly query$ = this.route.queryParamMap.pipe(map(readQuery), distinctUntilChanged(sameQuery));

  protected readonly query = toSignal(this.query$, { requireSync: true });

  protected readonly state = toSignal(
    combineLatest([this.query$, this.retry$]).pipe(switchMap(([query]) => toLoadState(this.api.listProducts(query)))),
    { initialValue: { status: 'loading' } as LoadState<Paginated<Product>> },
  );

  /** The list URL a product page's "Back" returns to, page and filter included. */
  protected readonly backTo = computed(() => {
    const { page, location, sort } = this.query();
    return this.router.serializeUrl(
      this.router.createUrlTree(['/products'], {
        queryParams: { location: location ?? null, sort: sort ?? null, page: page !== undefined && page > 1 ? page : null },
      }),
    );
  });

  protected readonly isFiltered = computed(() => this.query().location !== undefined);

  protected setLocation(location: Location | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { location, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected setSort(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: value === 'id_asc' ? null : value, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected firstPage(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: null }, queryParamsHandling: 'merge' });
  }

  protected retry(): void {
    this.retry$.next();
  }
}
