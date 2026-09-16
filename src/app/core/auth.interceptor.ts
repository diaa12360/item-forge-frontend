import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Subject, catchError, throwError } from 'rxjs';

import { toApiError } from './api-error';
import { TokenStorage } from './token-storage';

/**
 * Set on POST /auth/login: never send a stale token with fresh credentials,
 * and a 401 there means "wrong password", not "session expired".
 */
export const PUBLIC_ENDPOINT = new HttpContextToken<boolean>(() => false);

/**
 * "The API just rejected our token." AuthService listens and logs out.
 * A separate event bus keeps the interceptor from injecting AuthService,
 * which itself depends on HttpClient.
 */
@Injectable({ providedIn: 'root' })
export class SessionEvents {
  readonly unauthorized$ = new Subject<void>();
}

/**
 * Attaches `Authorization: Bearer <token>` to every API request, turns every
 * failure into an ApiError, and on a 401 clears the token and signals a logout.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStorage);
  const events = inject(SessionEvents);
  const isPublic = req.context.get(PUBLIC_ENDPOINT);

  const token = tokens.get();
  const authed =
    !isPublic && token !== null ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      if (error.status === 401 && !isPublic) {
        tokens.clear();
        events.unauthorized$.next();
      }
      return throwError(() => toApiError(error));
    }),
  );
};
