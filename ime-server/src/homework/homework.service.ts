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

@Injectable()
export class HomeworksService {
  constructor(private prisma: PrismaService) {}

  create(teacherId: string, dto: CreateHomeworkDto) {
    return this.prisma.homework.create({
      data: {
        lesson: {
          connect: {
            id: dto.lessonId,
          },
        },

        subject: {
          connect: {
            id: dto.subjectId,
          },
        },

        teacher: {
          connect: {
            id: dto.teacherId,
          },
        },

        title: dto.title,

        description: dto.description,

        deadline: new Date(dto.deadline),

        maxScore: dto.maxScore,
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
      },
    });
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
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        homework: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.homework.teacherId !== teacherId) {
      throw new ForbiddenException('You are not owner of this homework');
    }

    return this.prisma.homeworkSubmission.update({
      where: {
        id: submissionId,
      },

      data: {
        score: dto.score,
        feedback: dto.feedback,
        status: 'GRADED',
        gradedAt: new Date(),
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
  findMyHomeworks(studentId: string) {
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

        submissions: {
          where: {
            studentId,
          },

          select: {
            status: true,
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
  async studentGrades(studentId: string) {
    return this.prisma.homeworkSubmission.findMany({
      where: {
        studentId,
        status: 'GRADED',
      },

      select: {
        id: true,

        score: true,

        feedback: true,

        gradedAt: true,

        homework: {
          select: {
            title: true,

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
}
