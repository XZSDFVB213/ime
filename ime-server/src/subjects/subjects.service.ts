import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        credits: dto.credits,

        department: {
          connect: {
            id: dto.departmentId,
          },
        },
      },

      include: {
        department: true,
      },
    });
  }

  findAll() {
    return this.prisma.subject.findMany({
      include: {
        department: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.subject.findUnique({
      where: {
        id,
      },

      include: {
        department: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.subject.delete({
      where: {
        id,
      },
    });
  }
  async getSubjects(
  userId: string,
) {
  const student =
    await this.prisma.student.findUnique({
      where: {
        userId,
      },

      select: {
        id: true,
        groupId: true,
      },
    });


  if (!student) {
    throw new NotFoundException(
      'Профиль студента не найден',
    );
  }


  const assignments =
    await this.prisma.teacherDisciplineGroup.findMany({
      where: {
        groupId:
          student.groupId,
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

        teacher: {
          select: {
            id: true,
            position: true,

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
   * На всякий случай убираем
   * повтор одной дисциплины.
   */
  const subjects =
    new Map<
      string,
      any
    >();


  for (
    const assignment
    of assignments
  ) {
    if (
      !subjects.has(
        assignment.subject.id,
      )
    ) {
      subjects.set(
        assignment.subject.id,
        {
          ...assignment.subject,

          teacher:
            assignment.teacher,
        },
      );
    }
  }


  return Array.from(
    subjects.values(),
  );
}
}
