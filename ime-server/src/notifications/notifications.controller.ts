/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Получить все мои уведомления
   *
   * GET /notifications
   */
  @Get()
  findMyNotifications(@Req() req: any) {
    return this.notificationsService.findMyNotifications(req.user.id);
  }

  /**
   * Количество непрочитанных
   *
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.notificationsService.unreadCount(req.user.id);
  }

  /**
   * Прочитать все
   *
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  /**
   * Прочитать одно
   *
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  /**
   * Удалить уведомление
   *
   * DELETE /notifications/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.remove(id, req.user.id);
  }
}
