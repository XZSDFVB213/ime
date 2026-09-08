/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MaterialType, NotificationType } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { CreateLinkMaterialDto } from './dto/create-link-material.dto';

import { CreateFileMaterialDto } from './dto/create-file-material.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly notifications: NotificationsService,
  ) {}
  async createLink(teacherId: string, dto: CreateLinkMaterialDto) {
    await this.validateAccess(teacherId, dto.subjectId, dto.lessonId);

    const material = await this.prisma.material.create({
      data: {
        teacherId,

        subjectId: dto.subjectId,

        lessonId: dto.lessonId || null,

        title: dto.title.trim(),

        description: dto.description?.trim() || null,

        type: MaterialType.LINK,

        url: dto.url,
      },

      include: {
        subject: true,

        lesson: {
          include: {
            group: true,
          },
        },

        teacher: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    await this.notifyStudents(material);

    return material;
  }

  async createFile(
    teacherId: string,
    dto: CreateFileMaterialDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new NotFoundException('Файл не передан');
    }

    await this.validateAccess(teacherId, dto.subjectId, dto.lessonId);

    const material = await this.prisma.material.create({
      data: {
        teacherId,

        subjectId: dto.subjectId,

        lessonId: dto.lessonId || null,

        title: dto.title.trim(),

        description: dto.description?.trim() || null,

        type: MaterialType.FILE,

        url: `/uploads/materials/${file.filename}`,

        fileName: file.originalname,

        mimeType: file.mimetype,

        size: file.size,
      },

      include: {
        subject: true,

        lesson: {
          include: {
            group: true,
          },
        },

        teacher: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    await this.notifyStudents(material);

    return material;
  }

  async findMyTeacherMaterials(teacherId: string) {
    const materials = await this.prisma.material.findMany({
      where: {
        teacherId,
      },

      include: {
        subject: true,

        lesson: {
          include: {
            group: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return materials;
  }

  async findTeacherSubjectMaterials(teacherId: string, subjectId: string) {
    await this.validateAccess(teacherId, subjectId);

    return this.prisma.material.findMany({
      where: {
        teacherId,
        subjectId,
      },

      include: {
        subject: true,

        lesson: {
          include: {
            group: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findMyStudentMaterials(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId,
      },

      select: {
        groupId: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Профиль обучающегося не найден');
    }

    /*
     * Находим дисциплины,
     * которые есть у группы студента.
     */
    const lessons = await this.prisma.lesson.findMany({
      where: {
        groupId: student.groupId,
      },

      select: {
        id: true,
        subjectId: true,
      },
    });

    const subjectIds = [...new Set(lessons.map((lesson) => lesson.subjectId))];

    const lessonIds = new Set(lessons.map((lesson) => lesson.id));

    const materials = await this.prisma.material.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
      },

      include: {
        subject: true,

        lesson: {
          include: {
            group: true,
          },
        },

        teacher: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    /*
     * Материал дисциплины без lessonId
     * доступен всей группе.
     *
     * Материал конкретного занятия —
     * только если это занятие группы.
     */
    return materials.filter(
      (material) =>
        material.lessonId === null || lessonIds.has(material.lessonId),
    );
  }

  async remove(teacherId: string, materialId: string) {
    const material = await this.prisma.material.findUnique({
      where: {
        id: materialId,
      },
    });

    if (!material) {
      throw new NotFoundException('Материал не найден');
    }

    if (material.teacherId !== teacherId) {
      throw new ForbiddenException(
        'Материал принадлежит другому преподавателю',
      );
    }

    return this.prisma.material.delete({
      where: {
        id: materialId,
      },
    });
  }

  private async validateAccess(
    teacherId: string,
    subjectId: string,
    lessonId?: string,
  ) {
    /*
     * Если материал привязывается
     * к конкретному занятию.
     */
    if (lessonId) {
      const lesson = await this.prisma.lesson.findFirst({
        where: {
          id: lessonId,
          teacherId,
          subjectId,
        },
      });

      if (!lesson) {
        throw new ForbiddenException(
          'Занятие не найдено или не принадлежит преподавателю',
        );
      }

      return;
    }

    /*
     * Если материал общий
     * для дисциплины —
     * проверяем, что преподаватель
     * реально ведёт эту дисциплину.
     */
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        teacherId,
        subjectId,
      },
    });

    if (!lesson) {
      throw new ForbiddenException('Вы не ведёте эту дисциплину');
    }
  }
  private async notifyStudents(material: {
    id: string;
    title: string;
    subjectId: string;
    lessonId: string | null;
    teacherId: string | null;
  }) {
    /*
     * Название дисциплины получаем отдельно.
     *
     * Это работает и для материала преподавателя,
     * и для материала администратора.
     */
    const subject = await this.prisma.subject.findUnique({
      where: {
        id: material.subjectId,
      },

      select: {
        name: true,
      },
    });

    if (!subject) {
      return;
    }

    /*
     * Материал конкретного занятия.
     *
     * Уведомляем только студентов
     * группы этого занятия.
     */
    if (material.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: {
          id: material.lessonId,
        },

        select: {
          group: {
            select: {
              students: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!lesson) {
        return;
      }

      const userIds = lesson.group.students.map((student) => student.userId);

      if (!userIds.length) {
        return;
      }

      await this.notifications.createMany(userIds, {
        type: NotificationType.MATERIAL_CREATED,

        title: 'Новый учебный материал',

        message: `${subject.name}: «${material.title}»`,

        data: {
          materialId: material.id,

          subjectId: material.subjectId,

          lessonId: material.lessonId,
        },
      });

      return;
    }

    /*
     * Общий материал дисциплины.
     *
     * Если teacherId есть:
     *   материал создал преподаватель
     *   -> ищем его занятия.
     *
     * Если teacherId === null:
     *   материал создал администратор
     *   -> ищем ВСЕ занятия этой дисциплины.
     */
    const lessons = await this.prisma.lesson.findMany({
      where: {
        subjectId: material.subjectId,

        ...(material.teacherId
          ? {
              teacherId: material.teacherId,
            }
          : {}),
      },

      select: {
        group: {
          select: {
            students: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!lessons.length) {
      return;
    }

    /*
     * Один студент может попасть
     * через несколько занятий,
     * поэтому Set убирает дубли.
     */
    const userIds = new Set<string>();

    for (const lesson of lessons) {
      for (const student of lesson.group.students) {
        userIds.add(student.userId);
      }
    }

    if (!userIds.size) {
      return;
    }

    await this.notifications.createMany(Array.from(userIds), {
      type: NotificationType.MATERIAL_CREATED,

      title: 'Новый учебный материал',

      message: `${subject.name}: «${material.title}»`,

      data: {
        materialId: material.id,

        subjectId: material.subjectId,
      },
    });
  }
}
