import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth.guards';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · Itemforge',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      {
        path: 'products',
        title: 'Items · Itemforge',
        loadComponent: () => import('./pages/products/products-page').then((m) => m.ProductsPage),
      },
      {
        path: 'products/:id',
        title: 'Item · Itemforge',
        loadComponent: () =>
          import('./pages/product-details/product-details-page').then((m) => m.ProductDetailsPage),
      },
      {
        path: 'receipt/:orderId',
        title: 'Receipt · Itemforge',
        loadComponent: () => import('./pages/receipt/receipt-page').then((m) => m.ReceiptPage),
      },
    ],
  },
  {
    path: '**',
    title: 'Not found · Itemforge',
    loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
