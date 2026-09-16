import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { currencyFor, formatMoney, itemImageUrl, itemNumber } from '../../core/format';
import { Product } from '../../core/models';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  readonly product = input.required<Product>();
  /** The list URL to come back to, with its page and filter. */
  readonly backTo = input('/products');

  protected readonly number = computed(() => itemNumber(this.product().id));
  protected readonly image = computed(() => itemImageUrl(this.product().id, 400, 296));
  protected readonly price = computed(() => formatMoney(this.product().price));
  protected readonly currency = computed(() => currencyFor(this.product().location));
}
