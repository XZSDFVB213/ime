/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: {
        name: dto.name,

        department: {
          connect: {
            id: dto.departmentId,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.group.findMany({
      include: {
        department: {
          include: {
            faculty: true,
          },
        },

        students: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.group.findUnique({
      where: {
        id,
      },

      include: {
        department: {
          include: {
            faculty: true,
          },
        },

        students: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  remove(id: string) {
    return this.prisma.group.delete({
      where: {
        id,
      },
    });
  }
}
