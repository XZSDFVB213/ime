/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { mkdir, writeFile } from 'fs/promises';

import { extname, join } from 'path';

import { randomUUID } from 'crypto';

import { Role, UserStatus } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';

import { SendMessageDto } from './dto/send-message.dto';
import { SendAttachmentDto } from './dto/send-attachment.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  /*
   * =========================
   * CONTACTS
   * =========================
   */
  async sendAttachment(
    chatId: string,
    userId: string,
    dto: SendAttachmentDto,
    file: Express.Multer.File,
  ) {
    await this.assertParticipant(chatId, userId);

    if (!file) {
      throw new BadRequestException('Файл не передан');
    }

    const allowedMimeTypes = [
      'application/pdf',

      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',

      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',

      'application/zip',
      'application/x-zip-compressed',

      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Недопустимый тип файла');
    }

    const directory = join(process.cwd(), 'uploads', 'chat');

    await mkdir(directory, {
      recursive: true,
    });

    const extension = extname(file.originalname);

    const storedFileName = `${Date.now()}-${randomUUID()}${extension}`;

    const filePath = join(directory, storedFileName);

    await writeFile(filePath, file.buffer);

    const now = new Date();

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,

        text: dto.text?.trim() || null,

        attachments: {
          create: {
            url: `/uploads/chat/${storedFileName}`,

            fileName: file.originalname,

            mimeType: file.mimetype,

            size: file.size,
          },
        },
      },

      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },

        attachments: true,
      },
    });

    await this.prisma.chat.update({
      where: {
        id: chatId,
      },

      data: {
        lastMessageAt: now,
      },
    });

    await this.prisma.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },

      data: {
        lastReadAt: now,
      },
    });

    return message;
  }
  async findContacts(userId: string, search?: string) {
    const query = search?.trim() ?? '';

    return this.prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },

        status: UserStatus.ACTIVE,

        roles: {
          some: {
            role: {
              in: [Role.STUDENT, Role.TEACHER],
            },
          },
        },

        ...(query
          ? {
              OR: [
                {
                  fullName: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },

                {
                  email: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },

      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,

        roles: {
          select: {
            role: true,
          },
        },

        student: {
          select: {
            id: true,

            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        teacher: {
          select: {
            id: true,
            position: true,

            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },

      orderBy: {
        fullName: 'asc',
      },

      take: 50,
    });
  }

  /*
   * =========================
   * CREATE DIRECT CHAT
   * =========================
   */

  async createDirectChat(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Нельзя создать диалог с самим собой');
    }

    const target = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        status: UserStatus.ACTIVE,
      },

      select: {
        id: true,
      },
    });

    if (!target) {
      throw new NotFoundException('Пользователь не найден');
    }

    /*
     * Всегда одинаковый ключ:
     *
     * abc:def
     *
     * независимо от того,
     * кто начал диалог.
     */
    const directKey = [userId, targetUserId].sort().join(':');

    const existing = await this.prisma.chat.findUnique({
      where: {
        directKey,
      },

      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,

                roles: {
                  select: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.chat.create({
      data: {
        type: 'DIRECT',

        directKey,

        participants: {
          create: [
            {
              userId,
              lastReadAt: new Date(),
            },

            {
              userId: targetUserId,
            },
          ],
        },
      },

      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,

                roles: {
                  select: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /*
   * =========================
   * MY CHATS
   * =========================
   */

  async findMyChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },

      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,

                roles: {
                  select: {
                    role: true,
                  },
                },

                student: {
                  select: {
                    id: true,

                    group: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },

                teacher: {
                  select: {
                    id: true,
                    position: true,

                    department: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },

        messages: {
          orderBy: {
            createdAt: 'desc',
          },

          take: 1,

          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
            attachments: true,
          },
        },
      },

      orderBy: [
        {
          lastMessageAt: 'desc',
        },

        {
          createdAt: 'desc',
        },
      ],
    });

    /*
     * Prisma не может удобно
     * посчитать unread с lastReadAt
     * каждого participant внутри
     * findMany, поэтому считаем здесь.
     */
    return Promise.all(
      chats.map(async (chat) => {
        const currentParticipant = chat.participants.find(
          (participant) => participant.userId === userId,
        );

        const unreadCount = await this.prisma.message.count({
          where: {
            chatId: chat.id,

            senderId: {
              not: userId,
            },

            ...(currentParticipant?.lastReadAt
              ? {
                  createdAt: {
                    gt: currentParticipant.lastReadAt,
                  },
                }
              : {}),
          },
        });

        return {
          ...chat,
          unreadCount,
        };
      }),
    );
  }

  /*
   * =========================
   * MESSAGES
   * =========================
   */

  async findMessages(chatId: string, userId: string) {
    await this.assertParticipant(chatId, userId);

    return this.prisma.message.findMany({
      where: {
        chatId,
      },

      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        attachments: true,
      },

      orderBy: {
        createdAt: 'asc',
      },

      /*
       * Пока последние 200.
       * Потом сделаем pagination.
       */
      take: 200,
    });
  }

  /*
   * =========================
   * SEND MESSAGE
   * =========================
   */

  async sendMessage(chatId: string, userId: string, dto: SendMessageDto) {
    await this.assertParticipant(chatId, userId);

    const text = dto.text.trim();

    if (!text) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }

    const now = new Date();

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        text,
      },

      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        attachments: true,
      },
    });

    /*
     * Чтобы диалог поднимался
     * наверх списка.
     */
    await this.prisma.chat.update({
      where: {
        id: chatId,
      },

      data: {
        lastMessageAt: now,
      },
    });

    /*
     * Отправитель автоматически
     * прочитал собственное сообщение.
     */
    await this.prisma.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },

      data: {
        lastReadAt: now,
      },
    });

    return message;
  }

  /*
   * =========================
   * READ CHAT
   * =========================
   */
  async findChatPartnerUserIds(userId: string): Promise<string[]> {
    const participations = await this.prisma.chatParticipant.findMany({
      where: {
        userId,
      },

      select: {
        chat: {
          select: {
            participants: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    const ids = new Set<string>();

    for (const participation of participations) {
      for (const participant of participation.chat.participants) {
        if (participant.userId !== userId) {
          ids.add(participant.userId);
        }
      }
    }

    return Array.from(ids);
  }

  async isChatParticipant(chatId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },

      select: {
        id: true,
      },
    });

    return !!participant;
  }
  async findParticipantUserIds(chatId: string) {
    const participants = await this.prisma.chatParticipant.findMany({
      where: {
        chatId,
      },

      select: {
        userId: true,
      },
    });

    return participants.map((participant) => participant.userId);
  }
  async markAsRead(chatId: string, userId: string) {
    await this.assertParticipant(chatId, userId);

    return this.prisma.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },

      data: {
        lastReadAt: new Date(),
      },
    });
  }

  /*
   * =========================
   * CHECK ACCESS
   * =========================
   */

  private async assertParticipant(chatId: string, userId: string) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },

      select: {
        id: true,
      },
    });

    if (!participant) {
      throw new ForbiddenException('У вас нет доступа к этому диалогу');
    }
  }
}
