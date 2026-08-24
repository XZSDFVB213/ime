import { Module } from '@nestjs/common';

import { MaterialsController } from './materials.controller';

import { MaterialsService } from './materials.service';

import { PrismaService } from '../prisma.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
@Module({
  imports: [NotificationsModule],
  controllers: [MaterialsController],

  providers: [MaterialsService, PrismaService],
})
export class MaterialsModule {}
