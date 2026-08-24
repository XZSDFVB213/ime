/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { JwtService } from '@nestjs/jwt';

import { Server, Socket } from 'socket.io';

import { ChatsService } from './chats.service';
import { ConfigService } from '@nestjs/config';
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatsService: ChatsService,
  ) {}
  private readonly onlineUsers = new Map<string, Set<string>>();
  async handleConnection(socket: Socket) {
    try {
      console.log('[WS] incoming connection', socket.id);

      const authToken = socket.handshake.auth?.['token'];

      const authorization = socket.handshake.headers.authorization;

      const headerToken = authorization?.replace(/^Bearer\s+/i, '').trim();

      const token = authToken || headerToken;

      console.log('[WS] token exists:', !!token);

      if (!token) {
        console.log('[WS] DISCONNECT: token отсутствует');

        socket.disconnect();
        return;
      }

      const secret = this.configService.getOrThrow<string>('JWT_SECRET');

      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      console.log('[WS] JWT payload:', payload);

      const userId = payload.sub ?? payload.id ?? payload.userId;

      if (!userId) {
        console.log('[WS] DISCONNECT: userId не найден');

        socket.disconnect();
        return;
      }

      socket.data.userId = userId;

      await socket.join(`user:${userId}`);
      this.addOnlineSocket(userId, socket.id);

      /*
       * Сообщаем собеседникам:
       * пользователь появился онлайн.
       */
      await this.notifyPresence(userId, true);

      /*
       * А новому подключившемуся
       * сразу отправляем статусы
       * его собеседников.
       */
      const partnerIds = await this.chatsService.findChatPartnerUserIds(userId);

      for (const partnerId of partnerIds) {
        socket.emit('presence:update', {
          userId: partnerId,

          online: this.isOnline(partnerId),
        });
      }

      console.log(`[WS] AUTH OK: ${userId}`);
      console.log(`[WS] AUTH OK: ${userId}`);
    } catch (error) {
      console.error('[WS] AUTH ERROR:', error);

      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket) {
    const userId = socket.data?.userId;

    if (!userId) {
      return;
    }

    this.removeOnlineSocket(userId, socket.id);

    /*
     * Offline отправляем только тогда,
     * когда у пользователя не осталось
     * других соединений.
     */
    if (!this.isOnline(userId)) {
      await this.notifyPresence(userId, false);
    }

    console.log(`[WS] disconnected ${userId}`);
  }
  @SubscribeMessage('typing:start')
  async typingStart(
    @ConnectedSocket()
    socket: Socket,

    @MessageBody()
    body: {
      chatId: string;
    },
  ) {
    await this.emitTyping(socket, body.chatId, true);
  }

  @SubscribeMessage('typing:stop')
  async typingStop(
    @ConnectedSocket()
    socket: Socket,

    @MessageBody()
    body: {
      chatId: string;
    },
  ) {
    await this.emitTyping(socket, body.chatId, false);
  }
  private async emitTyping(socket: Socket, chatId: string, typing: boolean) {
    const userId = socket.data?.userId;

    if (!userId || !chatId) {
      return;
    }

    const allowed = await this.chatsService.isChatParticipant(chatId, userId);

    if (!allowed) {
      return;
    }

    const participantIds =
      await this.chatsService.findParticipantUserIds(chatId);

    for (const participantId of participantIds) {
      /*
       * Себе событие
       * отправлять не надо.
       */
      if (participantId === userId) {
        continue;
      }

      this.server.to(this.userRoom(participantId)).emit('typing:update', {
        chatId,
        userId,
        typing,
      });
    }
  }
  private addOnlineSocket(userId: string, socketId: string): void {
    const sockets = this.onlineUsers.get(userId) ?? new Set<string>();

    sockets.add(socketId);

    this.onlineUsers.set(userId, sockets);
  }

  private removeOnlineSocket(userId: string, socketId: string): void {
    const sockets = this.onlineUsers.get(userId);

    if (!sockets) {
      return;
    }

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
    }
  }

  private isOnline(userId: string): boolean {
    return (this.onlineUsers.get(userId)?.size ?? 0) > 0;
  }

  private async notifyPresence(userId: string, online: boolean) {
    const partnerIds = await this.chatsService.findChatPartnerUserIds(userId);

    for (const partnerId of partnerIds) {
      this.server.to(this.userRoom(partnerId)).emit('presence:update', {
        userId,
        online,
      });
    }
  }
  /*
   * Новое сообщение.
   *
   * Отправляем всем участникам
   * конкретного диалога.
   */
  async emitNewMessage(chatId: string, message: any) {
    const userIds = await this.chatsService.findParticipantUserIds(chatId);

    for (const userId of userIds) {
      this.server.to(this.userRoom(userId)).emit('message:new', {
        chatId,
        message,
      });
    }

    await this.emitChatChanged(chatId, userIds);
  }
  emitNotification(userId: string, notification: any): void {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }
  /*
   * Говорим клиентам:
   * список диалогов изменился.
   *
   * Например:
   * - новое сообщение
   * - прочитано
   * - создан новый чат
   */
  async emitChatChanged(chatId: string, knownUserIds?: string[]) {
    const userIds =
      knownUserIds ?? (await this.chatsService.findParticipantUserIds(chatId));

    for (const userId of userIds) {
      this.server.to(this.userRoom(userId)).emit('chat:changed', {
        chatId,
      });
    }
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }
}
