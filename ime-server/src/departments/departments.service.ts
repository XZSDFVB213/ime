/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: {
        name: dto.name,
        shortName: dto.shortName,

        faculty: {
          connect: {
            id: dto.facultyId,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.department.findMany({
      include: {
        faculty: true,
        groups: true,
        teachers: true,
        subjects: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.department.findUnique({
      where: {
        id,
      },

      include: {
        faculty: true,
        groups: true,
        teachers: true,
        subjects: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.department.delete({
      where: {
        id,
      },
    });
  }
}
