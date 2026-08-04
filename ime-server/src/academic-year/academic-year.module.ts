import { Module } from '@nestjs/common';
import { AcademicYearService } from './academic-year.service';
import { AcademicYearController } from './academic-year.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [AcademicYearController],
  providers: [AcademicYearService, PrismaService],
})
export class AcademicYearModule {}
