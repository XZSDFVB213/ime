import { Injectable, signal } from '@angular/core';

import { Subject } from 'rxjs';

import { io, Socket } from 'socket.io-client';

import { environment } from '../../../environments/environment';
import type { AppNotification } from '../../../shared/components/notification-bell/notification.service';
export interface RealtimeMessageEvent {
  chatId: string;

  message: any;
}
export interface TypingEvent {
  chatId: string;
  userId: string;
  typing: boolean;
}

export interface PresenceEvent {
  userId: string;
  online: boolean;
}
export interface RealtimeChatChangedEvent {
  chatId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatRealtimeService {
  private socket: Socket | null = null;

  private readonly messageSubject = new Subject<RealtimeMessageEvent>();

  private readonly chatChangedSubject = new Subject<RealtimeChatChangedEvent>();

  readonly message$ = this.messageSubject.asObservable();

  readonly chatChanged$ = this.chatChangedSubject.asObservable();

  readonly connected = signal(false);
  private readonly typingSubject = new Subject<TypingEvent>();

  private readonly presenceSubject = new Subject<PresenceEvent>();

  readonly typing$ = this.typingSubject.asObservable();

  readonly presence$ = this.presenceSubject.asObservable();
  private readonly notificationSubject = new Subject<AppNotification>();

  readonly notification$ = this.notificationSubject.asObservable();
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.warn('[WS] accessToken отсутствует');

      return;
    }

    this.socket = io(this.socketUrl(), {
      auth: {
        token,
      },

      transports: ['websocket'],

      reconnection: true,

      reconnectionAttempts: Infinity,

      reconnectionDelay: 1000,

      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('[WS] connected');

      this.connected.set(true);
    });
    this.socket.on('notification:new', (notification: AppNotification) => {
      this.notificationSubject.next(notification);
    });
    this.socket.on('disconnect', (reason) => {
      console.log('[WS] disconnected:', reason);

      this.connected.set(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WS] connect_error:', error.message);

      this.connected.set(false);
    });

    this.socket.on('message:new', (event: RealtimeMessageEvent) => {
      this.messageSubject.next(event);
    });
    this.socket.on('typing:update', (event: TypingEvent) => {
      this.typingSubject.next(event);
    });

    this.socket.on('presence:update', (event: PresenceEvent) => {
      this.presenceSubject.next(event);
    });
    this.socket.on('chat:changed', (event: RealtimeChatChangedEvent) => {
      this.chatChangedSubject.next(event);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();

    this.socket = null;

    this.connected.set(false);
  }
  startTyping(chatId: string): void {
    this.socket?.emit('typing:start', {
      chatId,
    });
  }

  stopTyping(chatId: string): void {
    this.socket?.emit('typing:stop', {
      chatId,
    });
  }
  private socketUrl(): string {
    /*
     * Работает даже если
     * environment.api будет:
     *
     * http://localhost:5000
     *
     * или:
     *
     * https://ime.ru/api
     */

    const url = new URL(environment.api);

    return `${url.protocol}//${url.host}`;
  }
}
