/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { CreateGroupSubjectDto } from './dto/create-group-subject.dto';
// import { UpdateGroupSubjectDto } from './dto/update-group-subject.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class GroupSubjectsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateGroupSubjectDto) {
    return this.prisma.groupSubject.create({
      data: {
        group: {
          connect: {
            id: dto.groupId,
          },
        },

        subject: {
          connect: {
            id: dto.subjectId,
          },
        },
      },

      include: {
        group: true,
        subject: true,
      },
    });
  }

  findAll() {
    return this.prisma.groupSubject.findMany({
      include: {
        group: true,
        subject: true,
      },
    });
  }

  delete(id: string) {
    return this.prisma.groupSubject.delete({
      where: {
        id,
      },
    });
  }
}
