import { Component, input, output } from '@angular/core';

/** Failed fetch: what went wrong, a retry, and the request id to quote. */
@Component({
  selector: 'app-error-state',
  templateUrl: './error-state.html',
  styleUrl: './error-state.css',
})
export class ErrorState {
  readonly heading = input('Something went wrong');
  readonly message = input.required<string>();
  readonly requestId = input<string | null>(null);
  readonly retryable = input(true);
  readonly retry = output<void>();
}
