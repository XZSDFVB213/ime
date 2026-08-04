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
