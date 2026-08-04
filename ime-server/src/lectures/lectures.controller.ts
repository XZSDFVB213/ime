/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LecturesService } from './lectures.service';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('lectures')
export class LecturesController {
  constructor(private readonly lecturesService: LecturesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Post()
  create(@Req() req, @Body() dto: CreateLectureDto) {
    return this.lecturesService.create(req.user.teacher.id, dto);
  }

  @Get()
  findAll() {
    return this.lecturesService.findAll();
  }
  @Get('by-lesson/:lessonId')
  findByLesson(@Param('lessonId') lessonId: string) {
    return this.lecturesService.findByLesson(lessonId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lecturesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLectureDto: UpdateLectureDto) {
    return this.lecturesService.update(id, updateLectureDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lecturesService.delete(id);
  }
}
