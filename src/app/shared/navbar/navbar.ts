import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  protected readonly initials = computed(() => (this.auth.user()?.username ?? '').slice(0, 2).toUpperCase());
}
