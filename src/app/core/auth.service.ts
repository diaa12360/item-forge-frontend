import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiError } from './api-error';
import { ApiService } from './api.service';
import { SessionEvents } from './auth.interceptor';
import { User } from './models';
import { TokenStorage } from './token-storage';

/** Who is signed in. The token lives in TokenStorage; this holds the user. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokens = inject(TokenStorage);
  private readonly router = inject(Router);

  private readonly currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    inject(SessionEvents).unauthorized$.subscribe(() => this.expireSession());
  }

  /**
   * Runs once before the first route resolves (provideAppInitializer), so a
   * hard refresh keeps the session. /auth/me is the source of truth for the
   * user; the JWT's own claims are never trusted. Never rejects.
   */
  async restore(): Promise<void> {
    if (this.tokens.get() === null) return;
    try {
      this.currentUser.set(await firstValueFrom(this.api.me()));
    } catch {
      // A 401 has already cleared the token in the interceptor. Any other
      // failure (backend down) leaves us logged out for this load.
      this.currentUser.set(null);
    }
  }

  /** Resolves with the user; rejects with the ApiError from login or /auth/me. */
  async login(username: string, password: string): Promise<User> {
    const { access_token } = await firstValueFrom(this.api.login({ username, password }));
    this.tokens.set(access_token);
    try {
      const user = await firstValueFrom(this.api.me());
      this.currentUser.set(user);
      return user;
    } catch (error) {
      this.tokens.clear();
      throw error instanceof ApiError ? error : new ApiError(0, 'unknown', 'Could not load your account.');
    }
  }

  logout(): void {
    this.tokens.clear();
    this.currentUser.set(null);
    void this.router.navigateByUrl('/login');
  }

  private expireSession(): void {
    if (this.currentUser() === null && this.router.url.startsWith('/login')) return;
    this.currentUser.set(null);
    const returnUrl = this.router.url;
    void this.router.navigate(['/login'], {
      queryParams: returnUrl.startsWith('/login') ? {} : { returnUrl, expired: 1 },
    });
  }
}
