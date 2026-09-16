import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Spinner],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  readonly open = input.required<boolean>();
  readonly heading = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly busyLabel = input('Working…');
  readonly busy = input(false);
  readonly error = input<string | null>(null);

  readonly confirmed = output<void>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  protected dismiss(): void {
    if (!this.busy()) this.dialog().nativeElement.close();
  }

  protected onCancelEvent(event: Event): void {
    if (this.busy()) event.preventDefault();
  }
}
