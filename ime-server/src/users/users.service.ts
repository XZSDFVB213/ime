/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

import { CreateUserDto } from './dto/create-user.dto';

import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const hash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,

        password: hash,

        fullName: dto.fullName,

        roles: {
          create: {
            role: dto.role,
          },
        },

        student:
          dto.role === Role.STUDENT
            ? {
                create: {
                  groupId: dto.groupId!,
                  admissionYear: new Date().getFullYear(),
                },
              }
            : undefined,

        teacher:
          dto.role === Role.TEACHER
            ? {
                create: {},
              }
            : undefined,
      },

      include: {
        roles: true,

        student: {
          include: {
            group: {
              include: {
                department: {
                  include: {
                    faculty: true,
                  },
                },
              },
            },
          },
        },

        teacher: true,
      },
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,

        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },

      include: {
        roles: true,
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }
}
