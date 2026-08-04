import { Module } from '@nestjs/common';
import { SubjectTeachersService } from './subject-teachers.service';
import { SubjectTeachersController } from './subject-teachers.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [SubjectTeachersController],
  providers: [SubjectTeachersService, PrismaService],
})
export class SubjectTeachersModule {}
