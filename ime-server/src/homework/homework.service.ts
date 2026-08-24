/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { PassHomeworkDto } from './dto/pass-homework.dto';
import { GradeHomeworkDto } from './dto/grade-homework.dto';
import { SubmissionStatus } from '@prisma/client';
import { NotificationType } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';
@Injectable()
export class HomeworksService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly notifications: NotificationsService,
  ) {}
  async create(teacherId: string, dto: CreateHomeworkDto) {
    /*
     * Проверяем:
     * - занятие существует;
     * - занятие принадлежит преподавателю.
     *
     * Сразу загружаем студентов группы,
     * чтобы потом раздать им уведомления.
     */
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: dto.lessonId,
        teacherId,
      },

      include: {
        subject: true,

        group: {
          include: {
            students: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new ForbiddenException(
        'Занятие не найдено или не принадлежит преподавателю',
      );
    }

    /*
     * Создаём ДЗ.
     *
     * ВАЖНО:
     * здесь уже не return сразу,
     * потому что после создания
     * надо отправить уведомления.
     */
    const homework = await this.prisma.homework.create({
      data: {
        teacherId,

        lessonId: lesson.id,
        subjectId: lesson.subjectId,

        title: dto.title.trim(),

        description: dto.description?.trim() ?? '',

        deadline: new Date(dto.deadline),

        maxScore: dto.maxScore,
      },

      include: {
        subject: true,

        lesson: {
          include: {
            group: true,
          },
        },

        submissions: true,
      },
    });

    /*
     * Получаем User ID всех студентов
     * группы этого занятия.
     */
    const studentUserIds = lesson.group.students
      .map((student) => student.userId)
      .filter(Boolean);

    /*
     * Если в группе есть студенты —
     * создаём каждому уведомление.
     */
    if (studentUserIds.length > 0) {
      await this.notifications.createMany(studentUserIds, {
        type: NotificationType.HOMEWORK_CREATED,

        title: 'Новое домашнее задание',

        message: `${lesson.subject.name}: «${homework.title}»`,

        data: {
          homeworkId: homework.id,

          subjectId: homework.subjectId,

          lessonId: homework.lessonId,

          groupId: lesson.groupId,

          deadline: homework.deadline.toISOString(),
        },
      });
    }

    return homework;
  }

  findAll() {
    return this.prisma.homework.findMany({
      include: {
        lesson: true,
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }
  findOne(id: string) {
    return this.prisma.homework.findUnique({
      where: {
        id,
      },

      include: {
        lesson: true,

        subject: true,

        teacher: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },

        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
  async findMy(studentId: string) {
    return this.prisma.homework.findMany({
      where: {
        lesson: {
          group: {
            students: {
              some: {
                id: studentId,
              },
            },
          },
        },
      },

      include: {
        lesson: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },

        submissions: {
          where: {
            studentId,
          },
        },
      },

      orderBy: {
        deadline: 'asc',
      },
    });
  }
  async passHomework(
    homeworkId: string,
    studentId: string,
    dto: PassHomeworkDto,
  ) {
    const exists = await this.prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId,
        },
      },
    });

    if (exists) {
      throw new BadRequestException('Homework already submitted');
    }
    return this.prisma.homeworkSubmission.create({
      data: {
        homework: {
          connect: {
            id: homeworkId,
          },
        },

        student: {
          connect: {
            id: studentId,
          },
        },

        content: dto.answer,

        status: 'SUBMITTED',

        submittedAt: new Date(),
      },

      include: {
        homework: true,
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }
  findMyTeacherHomeworks(teacherId: string) {
    return this.prisma.homework.findMany({
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

        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        deadline: 'asc',
      },
    });
  }
  async gradeSubmission(
    submissionId: string,
    teacherId: string,
    dto: GradeHomeworkDto,
  ) {
    /*
     * Сначала проверяем submission
     * и принадлежность ДЗ преподавателю.
     */
    const existingSubmission = await this.prisma.homeworkSubmission.findUnique({
      where: {
        id: submissionId,
      },

      include: {
        homework: true,
      },
    });

    if (!existingSubmission) {
      throw new NotFoundException('Submission not found');
    }

    if (existingSubmission.homework.teacherId !== teacherId) {
      throw new ForbiddenException('You are not owner of this homework');
    }

    /*
     * Заодно можно защититься
     * от оценки больше maxScore.
     */
    if (dto.score < 0 || dto.score > existingSubmission.homework.maxScore) {
      throw new BadRequestException(
        `Оценка должна быть от 0 до ${existingSubmission.homework.maxScore}`,
      );
    }

    /*
     * Обновляем работу.
     *
     * Здесь теперь специально загружаем:
     * - student.userId
     * - homework.subject
     *
     * Они нужны для уведомления.
     */
    const submission = await this.prisma.homeworkSubmission.update({
      where: {
        id: submissionId,
      },

      data: {
        score: dto.score,

        feedback: dto.feedback?.trim() || null,

        status: SubmissionStatus.GRADED,

        gradedAt: new Date(),
      },

      include: {
        student: {
          select: {
            id: true,
            userId: true,

            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },

        homework: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },

            lesson: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });

    /*
     * Уведомляем именно того студента,
     * чью работу проверили.
     */
    this.notifications.create(submission.student.userId, {
      type: NotificationType.HOMEWORK_GRADED,

      title: 'Работа проверена',

      message: `${submission.homework.subject.name}: «${submission.homework.title}» — ${submission.score}/${submission.homework.maxScore} баллов`,

      data: {
        homeworkId: submission.homework.id,

        submissionId: submission.id,

        subjectId: submission.homework.subjectId,

        lessonId: submission.homework.lessonId,

        score: submission.score,

        maxScore: submission.homework.maxScore,
      },
    });

    return submission;
  }
  async findMyHomeworks(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        groupId: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return this.prisma.homework.findMany({
      where: {
        lesson: {
          groupId: student.groupId,
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
                email: true,
                avatarUrl: true,
              },
            },
          },
        },

        // Важно: студенту возвращаем только его submission
        submissions: {
          where: {
            studentId,
          },
          select: {
            id: true,
            status: true,
            content: true,
            score: true,
            feedback: true,
            submittedAt: true,
            gradedAt: true,
          },
        },
      },

      orderBy: {
        deadline: 'asc',
      },
    });
  }

  async findMyGrades(studentId: string) {
    const submissions = await this.prisma.homeworkSubmission.findMany({
      where: {
        studentId,
        status: SubmissionStatus.GRADED,
        score: {
          not: null,
        },
      },

      include: {
        homework: {
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
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        gradedAt: 'desc',
      },
    });

    return submissions;
  }
  async findMyHomeworksTeacher(teacherId: string) {
    return this.prisma.homework.findMany({
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

        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async findMyHomework(homeworkId: string, studentId: string) {
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

    const homework = await this.prisma.homework.findFirst({
      where: {
        id: homeworkId,

        lesson: {
          groupId: student.groupId,
        },
      },

      include: {
        subject: true,

        lesson: {
          include: {
            group: true,
            semester: true,
          },
        },

        teacher: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },

        submissions: {
          where: {
            studentId,
          },

          select: {
            id: true,
            status: true,
            content: true,
            score: true,
            feedback: true,
            submittedAt: true,
            gradedAt: true,
          },
        },

        attachments: true,
      },
    });

    if (!homework) {
      throw new NotFoundException('Задание не найдено или недоступно');
    }

    return homework;
  }
  async findTeacherHomework(homeworkId: string, teacherId: string) {
    const homework = await this.prisma.homework.findFirst({
      where: {
        id: homeworkId,
        teacherId,
      },

      include: {
        subject: true,

        lesson: {
          include: {
            semester: true,

            group: {
              include: {
                students: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },

        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },

          orderBy: {
            submittedAt: 'desc',
          },
        },
      },
    });

    if (!homework) {
      throw new NotFoundException('Домашнее задание не найдено');
    }

    return homework;
  }
}
