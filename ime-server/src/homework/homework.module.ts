import { Module } from '@nestjs/common';
import { HomeworksService } from './homework.service';
import { HomeworksController } from './homework.controller';
import { PrismaService } from 'src/prisma.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [HomeworksController],
  providers: [HomeworksService, PrismaService],
})
export class HomeworkModule {}
