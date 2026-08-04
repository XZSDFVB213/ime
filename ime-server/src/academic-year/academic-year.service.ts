import { Injectable } from '@nestjs/common';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
// import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { PrismaService } from 'src/prisma.service';
@Injectable()
export class AcademicYearService {
  constructor(private prisma: PrismaService) {}
  create(createAcademicYearDto: CreateAcademicYearDto) {
    return this.prisma.academicYear.create({ data: createAcademicYearDto });
  }
}
