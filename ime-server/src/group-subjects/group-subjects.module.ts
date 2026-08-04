import { Module } from '@nestjs/common';
import { GroupSubjectsService } from './group-subjects.service';
import { GroupSubjectsController } from './group-subjects.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [GroupSubjectsController],
  providers: [GroupSubjectsService, PrismaService],
})
export class GroupSubjectsModule {}
