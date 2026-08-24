/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { ChatsService } from './chats.service';

import { SendMessageDto } from './dto/send-message.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatsGateway } from './chats.gateway';

import { FileInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';

import { SendAttachmentDto } from './dto/send-attachment.dto';
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(
    private readonly service: ChatsService,

    private readonly gateway: ChatsGateway,
  ) {}

  /*
   * GET /chats
   */
  @Get()
  findMyChats(@Req() req: any) {
    return this.service.findMyChats(req.user.id);
  }

  /*
   * GET /chats/contacts?search=Ахмед
   */
  @Get('contacts')
  findContacts(
    @Req() req: any,

    @Query('search')
    search?: string,
  ) {
    return this.service.findContacts(req.user.id, search);
  }
  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),

      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  async sendAttachment(
    @Req()
    req: any,

    @Param('id')
    chatId: string,

    @UploadedFile()
    file: Express.Multer.File,

    @Body()
    dto: SendAttachmentDto,
  ) {
    const message = await this.service.sendAttachment(
      chatId,
      req.user.id,
      dto,
      file,
    );

    await this.gateway.emitNewMessage(chatId, message);

    return message;
  }
  /*
   * POST /chats/direct/:userId
   */
  @Post('direct/:userId')
  async createDirectChat(
    @Req() req: any,

    @Param('userId')
    targetUserId: string,
  ) {
    const chat = await this.service.createDirectChat(req.user.id, targetUserId);

    await this.gateway.emitChatChanged(chat.id);

    return chat;
  }

  /*
   * GET /chats/:id/messages
   */
  @Get(':id/messages')
  findMessages(
    @Req() req: any,

    @Param('id')
    chatId: string,
  ) {
    return this.service.findMessages(chatId, req.user.id);
  }

  /*
   * POST /chats/:id/messages
   */
  @Post(':id/messages')
  async sendMessage(
    @Req() req: any,

    @Param('id')
    chatId: string,

    @Body()
    dto: SendMessageDto,
  ) {
    const message = await this.service.sendMessage(chatId, req.user.id, dto);

    await this.gateway.emitNewMessage(chatId, message);

    return message;
  }

  /*
   * PATCH /chats/:id/read
   */
  @Patch(':id/read')
  async markAsRead(
    @Req() req: any,

    @Param('id')
    chatId: string,
  ) {
    const result = await this.service.markAsRead(chatId, req.user.id);

    await this.gateway.emitChatChanged(chatId);

    return result;
  }
}
