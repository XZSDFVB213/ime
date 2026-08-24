import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import { ChatsGateway } from 'src/chat/chats.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: ChatsGateway,
  ) {}

  /**
   * Создать одно уведомление.
   */
  async create(
    userId: string,
    dto: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Prisma.InputJsonValue;
    },
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,

        type: dto.type,

        title: dto.title.trim(),

        message: dto.message.trim(),

        data: dto.data ?? undefined,
      },
    });

    this.realtime.emitNotification(userId, notification);

    return notification;
  }

  /**
   * Создать уведомления нескольким пользователям.
   *
   * Например всем студентам группы.
   */
  async createMany(
    userIds: string[],
    dto: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Prisma.InputJsonValue;
    },
  ) {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      return {
        count: 0,
      };
    }

    const notifications = await this.prisma.$transaction(
      uniqueUserIds.map((userId) =>
        this.prisma.notification.create({
          data: {
            userId,

            type: dto.type,

            title: dto.title.trim(),

            message: dto.message.trim(),

            data: dto.data ?? undefined,
          },
        }),
      ),
    );

    for (const notification of notifications) {
      this.realtime.emitNotification(notification.userId, notification);
    }

    return {
      count: notifications.length,

      notifications,
    };
  }

  /**
   * Все уведомления текущего пользователя.
   */
  findMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 100,
    });
  }

  /**
   * Количество непрочитанных.
   */
  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      count,
    };
  }

  /**
   * Прочитать одно уведомление.
   */
  async markAsRead(notificationId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },

      data: {
        isRead: true,
      },
    });

    return {
      success: result.count > 0,
    };
  }

  /**
   * Прочитать все уведомления.
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },

      data: {
        isRead: true,
      },
    });

    return {
      success: true,
      count: result.count,
    };
  }

  /**
   * Удалить уведомление.
   */
  async remove(notificationId: string, userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    return {
      success: result.count > 0,
    };
  }
}
