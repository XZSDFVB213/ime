import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';

import { DatePipe } from '@angular/common';

import { forkJoin } from 'rxjs';

import { finalize } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ChatService } from '../../services/chat.service';
import { ChatRealtimeService } from '../../services/chat-realtime.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-messages',

  standalone: true,

  imports: [DatePipe, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],

  templateUrl: './messages.html',
  styleUrl: './messages.scss',
})
export class MessagesComponent {
  private readonly chatService = inject(ChatService);

  private readonly snackBar = inject(MatSnackBar);
  readonly realtime = inject(ChatRealtimeService);

  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('messagesContainer')
  messagesContainer?: ElementRef<HTMLDivElement>;

  readonly me = signal<any | null>(null);

  readonly chats = signal<any[]>([]);

  readonly messages = signal<any[]>([]);

  readonly contacts = signal<any[]>([]);

  readonly loading = signal(true);

  readonly messagesLoading = signal(false);

  readonly sending = signal(false);

  readonly creatingChatId = signal<string | null>(null);

  readonly activeChatId = signal<string | null>(null);

  readonly messageText = signal('');

  readonly chatSearch = signal('');

  readonly contactSearch = signal('');

  readonly showContacts = signal(false);

  @ViewChild('attachmentInput')
  attachmentInput?: ElementRef<HTMLInputElement>;

  readonly selectedAttachment = signal<File | null>(null);

  readonly activeChat = computed(() => {
    const id = this.activeChatId();

    if (!id) {
      return null;
    }

    return this.chats().find((chat) => chat.id === id) ?? null;
  });

  readonly otherUser = computed(() => {
    const chat = this.activeChat();

    const me = this.me();

    if (!chat || !me) {
      return null;
    }

    return (
      chat.participants?.find((participant: any) => participant.userId !== me.id)?.user ?? null
    );
  });
  readonly otherUserTyping = computed(() => {
    const chatId = this.activeChatId();

    const user = this.otherUser();

    if (!chatId || !user) {
      return false;
    }

    return this.typingByChat().get(chatId) === user.id;
  });

  readonly filteredChats = computed(() => {
    const query = this.chatSearch().trim().toLocaleLowerCase('ru');

    if (!query) {
      return this.chats();
    }

    return this.chats().filter((chat) => {
      const user = this.getOtherUser(chat);

      const last = this.lastMessage(chat);

      return (
        user?.fullName?.toLocaleLowerCase('ru').includes(query) ||
        user?.email?.toLocaleLowerCase('ru').includes(query) ||
        last?.text?.toLocaleLowerCase('ru').includes(query)
      );
    });
  });

  readonly filteredContacts = computed(() => {
    const query = this.contactSearch().trim().toLocaleLowerCase('ru');

    return this.contacts().filter((contact) => {
      if (!query) {
        return true;
      }

      return (
        contact.fullName?.toLocaleLowerCase('ru').includes(query) ||
        contact.email?.toLocaleLowerCase('ru').includes(query) ||
        contact.student?.group?.name?.toLocaleLowerCase('ru').includes(query) ||
        contact.teacher?.department?.name?.toLocaleLowerCase('ru').includes(query)
      );
    });
  });

  readonly totalUnread = computed(() => {
    return this.chats().reduce((total, chat) => total + Number(chat.unreadCount ?? 0), 0);
  });

  constructor() {
    this.realtime.connect();

    this.realtime.message$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.handleRealtimeMessage(event);
    });

    this.realtime.chatChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadChats();
    });
    this.realtime.presence$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.onlineUserIds.update((current) => {
        const next = new Set(current);

        if (event.online) {
          next.add(event.userId);
        } else {
          next.delete(event.userId);
        }

        return next;
      });
    });
    this.realtime.typing$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.typingByChat.update((current) => {
        const next = new Map(current);

        if (event.typing) {
          next.set(event.chatId, event.userId);
        } else {
          next.delete(event.chatId);
        }

        return next;
      });
    });
    this.loadInitialData();
  }
  private appendMessage(message: any): void {
    this.messages.update((messages) => {
      const exists = messages.some((item) => item.id === message.id);

      if (exists) {
        return messages;
      }

      return [...messages, message];
    });
  }
  readonly onlineUserIds = signal<Set<string>>(new Set());

  readonly typingByChat = signal<Map<string, string>>(new Map());

  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  private typingChatId: string | null = null;
  readonly otherUserOnline = computed(() => {
    const user = this.otherUser();

    if (!user) {
      return false;
    }

    return this.onlineUserIds().has(user.id);
  });
  private handleRealtimeMessage(event: { chatId: string; message: any }): void {
    const { chatId, message } = event;

    /*
     * Если сейчас открыт
     * именно этот чат —
     * добавляем сообщение
     * сразу в окно.
     */
    if (this.activeChatId() === chatId) {
      this.appendMessage(message);

      this.scrollToBottom();

      /*
       * Если сообщение пришло
       * от другого пользователя,
       * сразу отмечаем прочитанным,
       * потому что чат открыт.
       */
      if (message.senderId !== this.me()?.id) {
        this.chatService.markAsRead(chatId).subscribe({
          error: (error) => {
            console.error('Ошибка markAsRead:', error);
          },
        });
      }
    }
  }
  messageRead(message: any): boolean {
    if (!this.messageOwn(message)) {
      return false;
    }

    const chat = this.activeChat();

    const me = this.me();

    if (!chat || !me) {
      return false;
    }

    const otherParticipant = chat.participants?.find(
      (participant: any) => participant.userId !== me.id,
    );

    const lastReadAt = otherParticipant?.lastReadAt;

    if (!lastReadAt) {
      return false;
    }

    return new Date(lastReadAt).getTime() >= new Date(message.createdAt).getTime();
  }
  selectChat(chat: any): void {
    if (this.activeChatId() === chat.id && this.messages().length) {
      return;
    }
    this.stopTyping();
    this.activeChatId.set(chat.id);

    this.loadMessages(chat.id);

    this.chatService.markAsRead(chat.id).subscribe({
      next: () => {
        this.chats.update((chats) =>
          chats.map((item) =>
            item.id === chat.id
              ? {
                  ...item,
                  unreadCount: 0,
                }
              : item,
          ),
        );
      },

      error: (error) => {
        console.error('Ошибка markAsRead:', error);
      },
    });
  }

  send(): void {
    const chatId = this.activeChatId();

    const text = this.messageText().trim();

    const file = this.selectedAttachment();

    if (!chatId || (!text && !file) || this.sending()) {
      return;
    }

    this.stopTyping();

    this.sending.set(true);

    const request$ = file
      ? this.chatService.sendAttachment(chatId, file, text || undefined)
      : this.chatService.sendMessage(chatId, text);

    request$.pipe(finalize(() => this.sending.set(false))).subscribe({
      next: (message) => {
        this.appendMessage(message);

        this.messageText.set('');

        this.removeAttachment();

        this.scrollToBottom();
      },

      error: (error) => {
        console.error('Ошибка отправки:', error);

        this.snackBar.open(error.error?.message ?? 'Не удалось отправить сообщение', 'Закрыть', {
          duration: 3500,
        });
      },
    });
  }
  attachmentUrl(attachment: any): string {
    if (attachment.url?.startsWith('http')) {
      return attachment.url;
    }

    const api = environment.api.replace(/\/$/, '');

    return `${api}${attachment.url}`;
  }

  attachmentIsImage(attachment: any): boolean {
    return attachment.mimeType?.startsWith('image/');
  }

  attachmentIcon(attachment: any): string {
    const mime = attachment.mimeType ?? '';

    if (mime === 'application/pdf') {
      return 'picture_as_pdf';
    }

    if (mime.includes('word')) {
      return 'description';
    }

    if (mime.includes('presentation') || mime.includes('powerpoint')) {
      return 'slideshow';
    }

    if (mime.includes('spreadsheet') || mime.includes('excel')) {
      return 'table_chart';
    }

    if (mime.includes('zip')) {
      return 'folder_zip';
    }

    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} Б`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} КБ`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  }
  startChat(contact: any): void {
    if (this.creatingChatId()) {
      return;
    }

    this.creatingChatId.set(contact.id);

    this.chatService
      .createDirectChat(contact.id)
      .pipe(finalize(() => this.creatingChatId.set(null)))
      .subscribe({
        next: (chat) => {
          this.showContacts.set(false);

          this.contactSearch.set('');

          this.loadChats(chat.id);
        },

        error: (error) => {
          console.error(error);

          this.snackBar.open(error.error?.message ?? 'Не удалось создать диалог', 'Закрыть', {
            duration: 3500,
          });
        },
      });
  }

  openContacts(): void {
    this.showContacts.set(true);
  }

  closeContacts(): void {
    this.showContacts.set(false);

    this.contactSearch.set('');
  }

  setMessageText(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;

    this.messageText.set(textarea.value);

    this.handleTyping();
  }
  private handleTyping(): void {
    const chatId = this.activeChatId();

    if (!chatId) {
      return;
    }

    /*
     * Если поле очистили —
     * прекращаем typing сразу.
     */
    if (!this.messageText().trim()) {
      this.stopTyping();

      return;
    }

    /*
     * Если пользователь только
     * начал печатать.
     */
    if (this.typingChatId !== chatId) {
      this.stopTyping();

      this.typingChatId = chatId;

      this.realtime.startTyping(chatId);
    }

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    /*
     * Если 1.3 сек ничего
     * не ввёл — перестал печатать.
     */
    this.typingTimer = setTimeout(() => {
      this.stopTyping();
    }, 1300);
  }
  private stopTyping(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);

      this.typingTimer = null;
    }

    if (this.typingChatId) {
      this.realtime.stopTyping(this.typingChatId);

      this.typingChatId = null;
    }
  }
  setChatSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.chatSearch.set(input.value);
  }

  setContactSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.contactSearch.set(input.value);
  }

  onMessageKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      this.send();
    }
  }

  getOtherUser(chat: any): any | null {
    const me = this.me();

    if (!me) {
      return null;
    }

    return (
      chat.participants?.find((participant: any) => participant.userId !== me.id)?.user ?? null
    );
  }

  lastMessage(chat: any): any | null {
    return chat.messages?.[0] ?? null;
  }

  initials(fullName: string | null | undefined): string {
    if (!fullName) {
      return '?';
    }

    return fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  roleLabel(user: any): string {
    if (user?.roles?.some((role: any) => role.role === 'TEACHER')) {
      return user.teacher?.position || 'Преподаватель';
    }

    if (user?.roles?.some((role: any) => role.role === 'STUDENT')) {
      return user.student?.group?.name || 'Обучающийся';
    }

    return 'Пользователь';
  }

  messageOwn(message: any): boolean {
    return message.senderId === this.me()?.id;
  }

  private loadInitialData(): void {
    this.loading.set(true);

    forkJoin({
      me: this.chatService.getMe(),

      chats: this.chatService.getChats(),

      contacts: this.chatService.getContacts(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ me, chats, contacts }) => {
          this.me.set(me);

          this.chats.set(chats ?? []);

          this.contacts.set(contacts ?? []);

          if (chats?.length) {
            this.selectChat(chats[0]);
          }
        },

        error: (error) => {
          console.error('Ошибка загрузки чатов:', error);

          this.snackBar.open('Не удалось загрузить сообщения', 'Закрыть', {
            duration: 4000,
          });
        },
      });
  }

  private loadMessages(chatId: string): void {
    this.messagesLoading.set(true);

    this.messages.set([]);

    this.chatService
      .getMessages(chatId)
      .pipe(finalize(() => this.messagesLoading.set(false)))
      .subscribe({
        next: (messages) => {
          /*
           * Если пока запрос шёл,
           * пользователь открыл другой чат,
           * старый ответ не применяем.
           */
          if (this.activeChatId() !== chatId) {
            return;
          }

          this.messages.set(messages ?? []);

          this.scrollToBottom();
        },

        error: (error) => {
          console.error('Ошибка загрузки сообщений:', error);

          this.snackBar.open('Не удалось загрузить переписку', 'Закрыть', {
            duration: 3000,
          });
        },
      });
  }

  private loadChats(selectChatId?: string): void {
    this.chatService.getChats().subscribe({
      next: (chats) => {
        this.chats.set(chats ?? []);

        if (selectChatId) {
          const chat = chats.find((item) => item.id === selectChatId);

          if (chat) {
            this.activeChatId.set(chat.id);

            this.loadMessages(chat.id);
          }
        }
      },

      error: (error) => {
        console.error('Ошибка обновления списка чатов:', error);
      },
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.messagesContainer?.nativeElement;

      if (!element) {
        return;
      }

      element.scrollTop = element.scrollHeight;
    });
  }
  selectAttachment(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const maxSize = 20 * 1024 * 1024;

    if (file.size > maxSize) {
      this.snackBar.open('Максимальный размер файла — 20 МБ', 'Закрыть', {
        duration: 3500,
      });

      input.value = '';

      return;
    }

    this.selectedAttachment.set(file);
  }
  removeAttachment(): void {
    this.selectedAttachment.set(null);

    if (this.attachmentInput) {
      this.attachmentInput.nativeElement.value = '';
    }
  }
}
