import { Module } from '@nestjs/common';

import { FacultiesController } from './faculties.controller';

import { FacultiesService } from './faculties.service';

import { PrismaService } from '../prisma.service';

@Module({
  controllers: [FacultiesController],

  providers: [FacultiesService, PrismaService],
})
export class FacultiesModule {}
