import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Signed-out visitors go to /login, remembering where they were headed. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** A signed-in user has no reason to see the login form. */
export const guestGuard: CanActivateFn = () => {
  if (!inject(AuthService).isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/products']);
};

/** Only same-app paths are valid redirect targets (no `//evil.com`). */
export function safeReturnUrl(value: string | null): string {
  if (value === null || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return '/products';
  }
  return value;
}
