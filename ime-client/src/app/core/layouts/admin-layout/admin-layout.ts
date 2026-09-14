import { Component, inject, signal } from '@angular/core';

import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell';

@Component({
  selector: 'app-admin-layout',

  standalone: true,

  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, NotificationBellComponent],

  templateUrl: './admin-layout.html',

  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  readonly sidebarOpened = signal(true);
  private router = inject(Router)

  toggleSidebar(): void {
    this.sidebarOpened.update((value) => !value);
  }
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    this.router.navigate(['/auth/login']);
  }
}
