import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  userId: string;

  type:
    | 'HOMEWORK_CREATED'
    | 'HOMEWORK_GRADED'
    | 'MATERIAL_CREATED'
    | 'NEW_MESSAGE'
    | 'SYSTEM'
    | 'MESSAGE'
    | 'HOMEWORK'
    | 'LESSON'
    | 'CONFERENCE'
    | 'GRADE';

  title: string;
  message: string;

  data: Record<string, any> | null;

  isRead: boolean;

  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);

  load(): void {
    this.http
      .get<AppNotification[]>(
        `${environment.api}/notifications`,
      )
      .subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);

          this.unreadCount.set(
            notifications.filter(
              (notification) => !notification.isRead,
            ).length,
          );
        },

        error: (error) => {
          console.error(
            'Ошибка загрузки уведомлений:',
            error,
          );
        },
      });
  }

  loadUnreadCount(): void {
    this.http
      .get<{ count: number }>(
        `${environment.api}/notifications/unread-count`,
      )
      .subscribe({
        next: (response) => {
          this.unreadCount.set(response.count);
        },
      });
  }

  markAsRead(id: string) {
    return this.http.patch(
      `${environment.api}/notifications/${id}/read`,
      {},
    );
  }

  markAllAsRead() {
    return this.http.patch<{
      success: boolean;
      count: number;
    }>(
      `${environment.api}/notifications/read-all`,
      {},
    );
  }

  remove(id: string) {
    return this.http.delete(
      `${environment.api}/notifications/${id}`,
    );
  }
}