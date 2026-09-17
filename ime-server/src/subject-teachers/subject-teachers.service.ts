import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateSubjectTeacherDto } from './dto/create-subject-teacher.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SubjectTeachersService {
  constructor(private prisma: PrismaService) {}
 async getSubjects(
  userId: string,
) {
  const teacher =
    await this.prisma.teacher.findUnique({
      where: {
        userId,
      },

      select: {
        id: true,
      },
    });


  if (!teacher) {
    throw new NotFoundException(
      'Профиль преподавателя не найден',
    );
  }


  const assignments =
    await this.prisma.teacherDisciplineGroup.findMany({
      where: {
        teacherId: teacher.id,
      },

      select: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            credits: true,

            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });


  const subjects =
    new Map<string, any>();


  for (const assignment of assignments) {
    const existing =
      subjects.get(
        assignment.subject.id,
      );


    if (existing) {
      const groupAlreadyAdded =
        existing.groups.some(
          (group: { id: string }) =>
            group.id ===
            assignment.group.id,
        );


      if (!groupAlreadyAdded) {
        existing.groups.push(
          assignment.group,
        );
      }

      continue;
    }


    subjects.set(
      assignment.subject.id,
      {
        ...assignment.subject,

        groups: [
          assignment.group,
        ],
      },
    );
  }


  return Array.from(
    subjects.values(),
  );
}
  async create(dto: CreateSubjectTeacherDto) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id: dto.subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Предмет не найден');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: {
        id: dto.teacherId,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    const exists = await this.prisma.subjectTeacher.findUnique({
      where: {
        subjectId_teacherId: {
          subjectId: dto.subjectId,
          teacherId: dto.teacherId,
        },
      },
    });

    if (exists) {
      throw new ConflictException('Этот преподаватель уже назначен на предмет');
    }

    return this.prisma.subjectTeacher.create({
      data: {
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
      },

      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },

        teacher: {
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

  findAll() {
    return this.prisma.subjectTeacher.findMany({
      include: {
        subject: true,

        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  remove(id: string) {
    return this.prisma.subjectTeacher.delete({
      where: {
        id,
      },
    });
  }
}
