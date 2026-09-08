import { Component, signal } from '@angular/core';

import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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

  toggleSidebar(): void {
    this.sidebarOpened.update((value) => !value);
  }
}
