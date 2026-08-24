import { Component, computed, DestroyRef, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

import { AppNotification, NotificationService } from './notification.service';
import { ChatRealtimeService } from '../../../features/messages/services/chat-realtime.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-notification-bell',

  standalone: true,

  imports: [CommonModule, MatIconModule, MatBadgeModule],

  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBellComponent {
  private readonly router = inject(Router);

  readonly service = inject(NotificationService);

  readonly opened = signal(false);

  readonly notifications = this.service.notifications;
  private readonly realtime = inject(ChatRealtimeService);
  readonly unreadCount = this.service.unreadCount;
  private readonly destroyRef = inject(DestroyRef);
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  constructor() {
    this.service.load();
    this.realtime.notification$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification) => {
        this.handleRealtimeNotification(notification);
      });

    /*
     * Важно:
     * сначала подписались,
     * потом connect().
     *
     * Так не потеряем быстро
     * пришедшее событие.
     */
    this.realtime.connect();
  }
  private handleRealtimeNotification(notification: AppNotification): void {
    const exists = this.service.notifications().some((item) => item.id === notification.id);

    if (exists) {
      return;
    }

    this.service.notifications.update((notifications) => [notification, ...notifications]);

    if (!notification.isRead) {
      this.service.unreadCount.update((count) => count + 1);
    }
  }
  toggle(): void {
    const next = !this.opened();

    this.opened.set(next);

    if (next) {
      this.service.load();
    }
  }

  close(): void {
    this.opened.set(false);
  }

  markAll(): void {
    if (!this.unreadCount()) {
      return;
    }

    this.service.markAllAsRead().subscribe({
      next: () => {
        this.service.notifications.update((notifications) =>
          notifications.map((notification) => ({
            ...notification,
            isRead: true,
          })),
        );

        this.service.unreadCount.set(0);
      },
    });
  }

  openNotification(notification: AppNotification): void {
    const navigate = () => {
      this.navigateByNotification(notification);
      this.close();
    };

    if (notification.isRead) {
      navigate();
      return;
    }

    this.service.markAsRead(notification.id).subscribe({
      next: () => {
        this.service.notifications.update((notifications) =>
          notifications.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        );

        this.service.unreadCount.update((count) => Math.max(0, count - 1));

        navigate();
      },
    });
  }

  remove(event: MouseEvent, notification: AppNotification): void {
    event.stopPropagation();

    this.service.remove(notification.id).subscribe({
      next: () => {
        this.service.notifications.update((notifications) =>
          notifications.filter((item) => item.id !== notification.id),
        );

        if (!notification.isRead) {
          this.service.unreadCount.update((count) => Math.max(0, count - 1));
        }
      },
    });
  }

  notificationIcon(notification: AppNotification): string {
    switch (notification.type) {
      case 'HOMEWORK_CREATED':
        return 'assignment';

      case 'HOMEWORK_GRADED':
      case 'GRADE':
        return 'task_alt';

      case 'MATERIAL_CREATED':
        return 'library_books';

      case 'NEW_MESSAGE':
      case 'MESSAGE':
        return 'chat';

      case 'LESSON':
        return 'event';

      case 'CONFERENCE':
        return 'videocam';

      default:
        return 'notifications';
    }
  }

  private navigateByNotification(notification: AppNotification): void {
    const data = notification.data ?? {};

    const currentUrl = this.router.url;

    const root = currentUrl.startsWith('/teacher') ? '/teacher' : '/student';

    switch (notification.type) {
      case 'HOMEWORK_CREATED': {
        if (root === '/student' && data['homeworkId']) {
          this.router.navigate([root, 'homeworks', data['homeworkId']]);
        } else {
          this.router.navigate([root, 'homeworks']);
        }

        break;
      }

      case 'HOMEWORK_GRADED':
      case 'HOMEWORK': {
        if (data['homeworkId']) {
          this.router.navigate([root, 'homeworks', data['homeworkId']]);
        } else {
          this.router.navigate([root, 'homeworks']);
        }

        break;
      }

      case 'MATERIAL_CREATED': {
        this.router.navigate([root, 'materials']);

        break;
      }

      case 'NEW_MESSAGE':
      case 'MESSAGE': {
        this.router.navigate([root, 'messages']);

        break;
      }

      case 'LESSON': {
        this.router.navigate([root, 'schedule']);

        break;
      }

      default: {
        break;
      }
    }
  }

  formatDate(date: string): string {
    const value = new Date(date);

    const now = new Date();

    const diff = now.getTime() - value.getTime();

    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
      return 'сейчас';
    }

    if (minutes < 60) {
      return `${minutes} мин`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} ч`;
    }

    return value.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
    });
  }
}
