import { Injectable } from '@nestjs/common';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SemesterService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateSemesterDto) {
    return this.prisma.semester.create({
      data: {
        name: dto.name,

        number: dto.number,

        academicYear: {
          connect: {
            id: dto.academicYearId,
          },
        },
      },

      include: {
        academicYear: true,
      },
    });
  }
}
