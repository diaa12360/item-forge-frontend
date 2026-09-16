import { Injectable } from '@angular/core';

const TOKEN_STORAGE_KEY = 'itemforge.access_token';

/**
 * The one place the JWT is read and written.
 *
 * Kept in localStorage so a hard refresh keeps the session, and mirrored in
 * memory so the interceptor reads it synchronously. localStorage access can
 * throw (private mode, blocked site data); on failure the in-memory copy is
 * the only store and the session lasts until the tab closes.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private token: string | null = this.readFromStorage();

  get(): string | null {
    return this.token;
  }

  set(token: string): void {
    this.token = token.trim() === '' ? null : token;
    try {
      if (this.token === null) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } else {
        localStorage.setItem(TOKEN_STORAGE_KEY, this.token);
      }
    } catch {
      // Storage unavailable: the in-memory copy still holds the token.
    }
  }

  clear(): void {
    this.token = null;
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Nothing to do: the in-memory copy is already cleared.
    }
  }

  private readFromStorage(): string | null {
    try {
      const value = localStorage.getItem(TOKEN_STORAGE_KEY);
      return value !== null && value.trim() !== '' ? value : null;
    } catch {
      return null;
    }
  }
}
