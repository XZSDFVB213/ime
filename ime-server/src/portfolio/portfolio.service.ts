/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PortfolioItemType } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyPortfolio(studentId: string) {
    const portfolio = await this.prisma.portfolioItem.findMany({
      where: {
        studentId,
      },

      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
    return portfolio;
  }

  async createLink(
    studentId: string,

    dto: {
      title: string;
      description?: string;
      type: PortfolioItemType;
      subjectId?: string;
      url: string;
    },
  ) {
    await this.validateSubject(studentId, dto.subjectId);

    return this.prisma.portfolioItem.create({
      data: {
        studentId,

        title: dto.title.trim(),

        description: dto.description?.trim() || null,

        type: dto.type,

        subjectId: dto.subjectId || null,

        url: dto.url.trim(),
      },

      include: {
        subject: true,
      },
    });
  }

  async createFile(
    studentId: string,

    dto: {
      title: string;
      description?: string;
      type: PortfolioItemType;
      subjectId?: string;
    },

    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new NotFoundException('Файл не передан');
    }

    await this.validateSubject(studentId, dto.subjectId);

    return this.prisma.portfolioItem.create({
      data: {
        studentId,

        title: dto.title.trim(),

        description: dto.description?.trim() || null,

        type: dto.type,

        subjectId: dto.subjectId || null,

        url: `/uploads/portfolio/${file.filename}`,

        fileName: file.originalname,

        mimeType: file.mimetype,

        size: file.size,
      },

      include: {
        subject: true,
      },
    });
  }

  async remove(studentId: string, itemId: string) {
    const item = await this.prisma.portfolioItem.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!item) {
      throw new NotFoundException('Работа не найдена');
    }

    if (item.studentId !== studentId) {
      throw new ForbiddenException('Нет доступа к этой работе');
    }

    await this.prisma.portfolioItem.delete({
      where: {
        id: itemId,
      },
    });

    return {
      success: true,
    };
  }

  private async validateSubject(studentId: string, subjectId?: string) {
    if (!subjectId) {
      return;
    }

    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId,
      },

      select: {
        groupId: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Студент не найден');
    }

    const lesson = await this.prisma.lesson.findFirst({
      where: {
        groupId: student.groupId,

        subjectId,
      },
    });

    if (!lesson) {
      throw new ForbiddenException('Дисциплина недоступна студенту');
    }
  }
}
