import { Observable, catchError, map, of, startWith } from 'rxjs';

import { ApiError } from './api-error';

/** What every page renders from: loading, the data, or the error. */
export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: ApiError };

/** Wrap a request so it emits loading first, then data or error — never throws. */
export function toLoadState<T>(source: Observable<T>): Observable<LoadState<T>> {
  return source.pipe(
    map((data): LoadState<T> => ({ status: 'ready', data })),
    catchError((error: unknown) =>
      of<LoadState<T>>({
        status: 'error',
        error: error instanceof ApiError ? error : new ApiError(0, 'unknown', 'Something went wrong. Please try again.'),
      }),
    ),
    startWith<LoadState<T>>({ status: 'loading' }),
  );
}

/** Route ids are positive 32-bit ints; anything else is a local not-found, no request sent. */
export function parseId(raw: string | null): number | null {
  if (raw === null || !/^[0-9]{1,10}$/.test(raw)) return null;
  const value = Number(raw);
  return value >= 1 && value <= 2147483647 ? value : null;
}
