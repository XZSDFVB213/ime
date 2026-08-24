import { Injectable } from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { PrismaService } from 'src/prisma.service';
@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  create(createLessonDto: CreateLessonDto) {
    return this.prisma.lesson.create({ data: createLessonDto });
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
