/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { CreateLessonDto } from './dto/create-lesson.dto';
import { PrismaService } from 'src/prisma.service';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AssessmentResult, LessonType } from '@prisma/client';

import { SaveLessonAssessmentsDto } from './dto/save-lesson-assessments.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}
  async removeLesson(teacherId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        teacherId,
      },

      select: {
        id: true,
        title: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Занятие не найдено или недоступно');
    }

    const [homeworksCount, materialsCount, assessmentsCount] =
      await Promise.all([
        this.prisma.homework.count({
          where: {
            lessonId,
          },
        }),

        this.prisma.material.count({
          where: {
            lessonId,
          },
        }),

        this.prisma.lessonAssessment.count({
          where: {
            lessonId,
          },
        }),
      ]);

    if (homeworksCount > 0 || materialsCount > 0 || assessmentsCount > 0) {
      throw new ConflictException(
        'Нельзя удалить занятие: к нему уже привязаны задания, материалы или результаты аттестации',
      );
    }

    await this.prisma.lesson.delete({
      where: {
        id: lessonId,
      },
    });

    return {
      success: true,
      id: lessonId,
    };
  }
  async create(teacherId: string, dto: CreateLessonDto) {
    /*
     * Проверяем:
     *
     * этому преподавателю действительно
     * назначены именно эта дисциплина
     * и именно эта группа.
     */
    const assignment = await this.prisma.teacherDisciplineGroup.findUnique({
      where: {
        teacherId_subjectId_groupId: {
          teacherId,
          subjectId: dto.subjectId,
          groupId: dto.groupId,
        },
      },

      select: {
        id: true,
      },
    });

    if (!assignment) {
      throw new ForbiddenException(
        'Дисциплина и группа не назначены преподавателю',
      );
    }

    const semester = await this.prisma.semester.findUnique({
      where: {
        id: dto.semesterId,
      },

      select: {
        id: true,
      },
    });

    if (!semester) {
      throw new NotFoundException('Семестр не найден');
    }

    const lessonDate = new Date(dto.date);

    if (Number.isNaN(lessonDate.getTime())) {
      throw new BadRequestException('Некорректная дата занятия');
    }

    return this.prisma.lesson.create({
      data: {
        subjectId: dto.subjectId,

        teacherId,

        semesterId: dto.semesterId,

        groupId: dto.groupId,

        title: dto.title.trim(),

        type: dto.type,

        date: lessonDate,

        duration: dto.duration,

        description: dto.description?.trim() || null,

        location: dto.location?.trim() || null,
      },

      include: {
        subject: true,

        group: true,

        semester: true,

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
  }
  getSemesters() {
    return this.prisma.semester.findMany({
      select: {
        id: true,
        name: true,
        number: true,

        academicYear: {
          select: {
            id: true,
            year: true,
          },
        },
      },

      orderBy: [
        {
          academicYear: {
            year: 'desc',
          },
        },
        {
          number: 'asc',
        },
      ],
    });
  }
  findAll() {
    return this.prisma.lesson.findMany({ include: { subject: true } });
  }
  private validateAssessmentResult(
    lessonType: LessonType,
    result: AssessmentResult,
  ): void {
    const examResults: AssessmentResult[] = [
      AssessmentResult.EXCELLENT,
      AssessmentResult.GOOD,
      AssessmentResult.SATISFACTORY,
      AssessmentResult.UNSATISFACTORY,
    ];

    const creditResults: AssessmentResult[] = [
      AssessmentResult.PASSED,
      AssessmentResult.NOT_PASSED,
    ];

    if (lessonType === LessonType.EXAM && !examResults.includes(result)) {
      throw new BadRequestException(
        'Для экзамена доступны только оценки: отлично, хорошо, удовлетворительно и неудовлетворительно',
      );
    }

    if (lessonType === LessonType.CREDIT && !creditResults.includes(result)) {
      throw new BadRequestException(
        'Для зачёта доступны только результаты «Зачтено» и «Не зачтено»',
      );
    }
  }
  async saveLessonAssessments(
    teacherId: string,
    lessonId: string,
    dto: SaveLessonAssessmentsDto,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        teacherId,
      },

      select: {
        id: true,
        type: true,
        groupId: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Занятие не найдено или недоступно');
    }

    if (lesson.type !== LessonType.EXAM && lesson.type !== LessonType.CREDIT) {
      throw new BadRequestException(
        'Оценивание доступно только для экзамена или зачёта',
      );
    }

    /*
     * Не позволяем одному студенту
     * прийти в DTO дважды.
     */
    const studentIds = [
      ...new Set(dto.assessments.map((item) => item.studentId)),
    ];

    if (studentIds.length !== dto.assessments.length) {
      throw new BadRequestException('Один студент указан несколько раз');
    }

    /*
     * Проверяем, что все студенты
     * реально принадлежат группе занятия.
     */
    const students = await this.prisma.student.findMany({
      where: {
        id: {
          in: studentIds,
        },

        groupId: lesson.groupId,
      },

      select: {
        id: true,
      },
    });

    if (students.length !== studentIds.length) {
      throw new ForbiddenException(
        'Один или несколько студентов не принадлежат группе занятия',
      );
    }

    /*
     * Проверяем допустимые результаты.
     */
    for (const assessment of dto.assessments) {
      this.validateAssessmentResult(lesson.type, assessment.result);
    }

    /*
     * У студента на конкретном
     * экзамене/зачёте одна актуальная
     * оценка, поэтому upsert.
     */
    await this.prisma.$transaction(
      dto.assessments.map((assessment) =>
        this.prisma.lessonAssessment.upsert({
          where: {
            lessonId_studentId: {
              lessonId,
              studentId: assessment.studentId,
            },
          },

          create: {
            lessonId,

            studentId: assessment.studentId,

            result: assessment.result,

            comment: assessment.comment?.trim() || null,
          },

          update: {
            result: assessment.result,

            comment: assessment.comment?.trim() || null,
          },
        }),
      ),
    );

    return this.getLessonAssessments(teacherId, lessonId);
  }
  async getLessonAssessments(teacherId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        teacherId,
      },

      select: {
        id: true,
        title: true,
        type: true,
        date: true,

        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },

        group: {
          select: {
            id: true,
            name: true,

            students: {
              where: {
                user: {
                  status: {
                    not: 'DELETED',
                  },
                },
              },

              select: {
                id: true,

                user: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },

              orderBy: {
                user: {
                  fullName: 'asc',
                },
              },
            },
          },
        },

        assessments: {
          select: {
            id: true,
            studentId: true,
            result: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Занятие не найдено или недоступно');
    }

    if (lesson.type !== LessonType.EXAM && lesson.type !== LessonType.CREDIT) {
      throw new BadRequestException(
        'Оценивание доступно только для экзамена или зачёта',
      );
    }

    return lesson;
  }
  findAllByGroup(groupId: string) {
    return this.prisma.lesson.findMany({
      where: {
        groupId,
      },
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
        semester: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.lesson.findUnique({
      where: {
        id,
      },
      include: {
        lecture: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
        group: true,
        semester: true,
      },
    });
  }
  findMySchedule(studentId: string) {
    return this.prisma.lesson.findMany({
      where: {
        group: {
          students: {
            some: {
              id: studentId,
            },
          },
        },
      },

      select: {
        id: true,

        title: true,

        type: true,

        date: true,

        duration: true,

        location: true,

        subject: {
          select: {
            name: true,
            code: true,
          },
        },

        teacher: {
          select: {
            user: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },

        semester: {
          select: {
            name: true,
            number: true,
          },
        },
      },

      orderBy: {
        date: 'asc',
      },
    });
  }
  findMyLessons(teacherId: string) {
    return this.prisma.lesson.findMany({
      where: {
        teacherId,
      },

      include: {
        subject: true,

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

        semester: true,
      },

      orderBy: {
        date: 'asc',
      },
    });
  }
}
