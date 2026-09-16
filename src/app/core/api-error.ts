import { HttpErrorResponse } from '@angular/common/http';

/** Status used when the request never reached the API (offline, DNS, CORS). */
export const NETWORK_ERROR_STATUS = 0;

/**
 * Every failed API call surfaces as this. Pages branch on `status`
 * (404 → not-found state), show `message`, and can quote `requestId`.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId: string | null = null,
    readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have access to this resource.',
  404: 'Not found.',
  500: 'Something went wrong on our side. Please try again later.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Normalise an HttpErrorResponse (including the backend error envelope) into an ApiError. */
export function toApiError(response: HttpErrorResponse): ApiError {
  if (response.status === NETWORK_ERROR_STATUS) {
    return new ApiError(
      NETWORK_ERROR_STATUS,
      'network_error',
      'Could not reach the server. Check your connection and try again.',
    );
  }

  const body: unknown = response.error;
  const envelope = isRecord(body) && isRecord(body['error']) ? body['error'] : null;
  const code = envelope !== null && typeof envelope['code'] === 'string' ? envelope['code'] : null;
  const message =
    envelope !== null && typeof envelope['message'] === 'string' ? envelope['message'] : null;
  const requestId =
    response.headers.get('X-Request-ID') ??
    (isRecord(body) && typeof body['request_id'] === 'string' ? body['request_id'] : null);

  return new ApiError(
    response.status,
    code ?? `http_${response.status}`,
    message ?? FALLBACK_MESSAGES[response.status] ?? `Request failed with status ${response.status}.`,
    requestId,
    envelope?.['details'] ?? null,
  );
}

/** A user-facing message for anything thrown by the API layer. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return error instanceof ApiError ? error.message : fallback;
}
