import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class LecturesService {
  constructor(private prisma: PrismaService) {}

  async create(teacherId: string, dto: CreateLectureDto) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: dto.lessonId,
        teacherId,
      },
    });

    if (!lesson) {
      throw new ForbiddenException('You are not owner of this lesson');
    }

    return this.prisma.lecture.create({
      data: {
        lessonId: dto.lessonId,
        content: dto.content,
        slidesUrl: dto.slidesUrl,
      },
    });
  }
  findAll() {
    return this.prisma.lecture.findMany({ include: { lesson: true } });
  }

  findOne(id: string) {
    return this.prisma.lecture.findUnique({
      where: {
        id,
      },
      include: {
        lesson: true,
      },
    });
  }
  update(id: string, updateLectureDto: UpdateLectureDto) {
    return this.prisma.lecture.update({
      where: { id },
      data: updateLectureDto,
    });
  }
  delete(id: string) {
    return this.prisma.lecture.delete({ where: { id } });
  }
  findByLesson(lessonId: string) {
    return this.prisma.lecture.findMany({
      where: {
        lessonId,
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
      },
    });
  }
}
