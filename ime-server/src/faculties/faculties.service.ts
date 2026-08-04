/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

import { CreateFacultyDto } from './dto/create-faculty.dto';

@Injectable()
export class FacultiesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateFacultyDto) {
    return this.prisma.faculty.create({
      data: {
        name: dto.name,
        shortName: dto.shortName,
      },
    });
  }

  findAll() {
    return this.prisma.faculty.findMany({
      include: {
        departments: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.faculty.findUnique({
      where: {
        id,
      },

      include: {
        departments: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.faculty.delete({
      where: {
        id,
      },
    });
  }
}
