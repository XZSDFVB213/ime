import { Module } from '@nestjs/common';
import { HomeworksService } from './homework.service';
import { HomeworksController } from './homework.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [HomeworksController],
  providers: [HomeworksService, PrismaService],
})
export class HomeworkModule {}
