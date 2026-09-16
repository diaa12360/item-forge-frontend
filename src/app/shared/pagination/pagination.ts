import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

type PageSlot = { kind: 'page'; page: number } | { kind: 'gap'; key: string };

/** Page links live in the URL (?page=N), so back/forward and refresh just work. */
@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly itemsOnPage = input.required<number>();

  protected readonly from = computed(() =>
    this.itemsOnPage() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly to = computed(() => this.from() + Math.max(this.itemsOnPage() - 1, 0));

  /** First, last, and a window of one either side of the current page. */
  protected readonly slots = computed<PageSlot[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    const wanted = new Set([1, total, current - 1, current, current + 1]);
    const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const slots: PageSlot[] = [];
    pages.forEach((p, i) => {
      if (i > 0 && p - pages[i - 1] > 1) slots.push({ kind: 'gap', key: `gap-${p}` });
      slots.push({ kind: 'page', page: p });
    });
    return slots;
  });

  /** Page 1 is the default, so it drops out of the URL. */
  protected pageParam(page: number): number | null {
    return page > 1 ? page : null;
  }
}
