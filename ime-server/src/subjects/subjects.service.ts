import { Injectable } from '@nestjs/common';
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
}
