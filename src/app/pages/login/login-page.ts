import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { ApiError } from '../../core/api-error';
import { safeReturnUrl } from '../../core/auth.guards';
import { AuthService } from '../../core/auth.service';
import { Spinner } from '../../shared/spinner/spinner';

const WALL = ['Sw', 'Sh', 'Po', 'My', 'Ri', 'He', 'Ar', 'Bo', 'Gl', 'Ca'];

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, Spinner],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly wall = WALL.map((symbol, i) => ({ symbol, num: String(i + 1).padStart(3, '0'), lit: i % 3 === 0 }));

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly expired = toSignal(this.route.queryParamMap.pipe(map((q) => q.has('expired'))), {
    initialValue: false,
  });

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();

    try {
      await this.auth.login(username.trim(), password);
      await this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')));
    } catch (err) {
      // The API never says which field was wrong, and neither do we.
      this.error.set(
        err instanceof ApiError && err.status === 401
          ? 'Invalid username or password.'
          : err instanceof ApiError
            ? err.message
            : 'Something went wrong. Please try again.',
      );
      this.submitting.set(false);
    }
  }

  protected showFieldError(name: 'username' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }
}
