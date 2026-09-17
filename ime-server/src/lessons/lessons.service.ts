import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { PrismaService } from 'src/prisma.service';
@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

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
