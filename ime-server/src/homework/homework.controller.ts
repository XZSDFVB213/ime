/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Role } from '@prisma/client';

import { HomeworksService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { GradeHomeworkDto } from './dto/grade-homework.dto';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('homeworks')
export class HomeworksController {
  constructor(private readonly service: HomeworksService) {}

  // =========================
  // TEACHER
  // =========================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Post()
  create(@Req() req: any, @Body() dto: CreateHomeworkDto) {
    return this.service.create(req.user.teacher.id, dto);
  }

  // ВАЖНО: статический роут раньше teacher/:id
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Get('teacher/my-homeworks')
  findTeacherHomeworks(@Req() req: any) {
    return this.service.findMyTeacherHomeworks(req.user.teacher.id);
  }

  // ВАЖНО: после teacher/my-homeworks
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Get('teacher/:id')
  findTeacherHomework(@Req() req: any, @Param('id') homeworkId: string) {
    return this.service.findTeacherHomework(homeworkId, req.user.teacher.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Patch('submissions/:id/grade')
  grade(
    @Param('id') submissionId: string,
    @Body() dto: GradeHomeworkDto,
    @Req() req: any,
  ) {
    return this.service.gradeSubmission(submissionId, req.user.teacher.id, dto);
  }

  // =========================
  // STUDENT
  // =========================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Get('my-grades')
  findMyGrades(@Req() req: any) {
    if (!req.user.student) {
      throw new ForbiddenException(
        'Для пользователя не создан профиль обучающегося',
      );
    }

    return this.service.findMyGrades(req.user.student.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Get('my-homeworks')
  findMyHomeworks(@Req() req: any) {
    if (!req.user.student) {
      throw new ForbiddenException(
        'Для пользователя не создан профиль обучающегося',
      );
    }

    return this.service.findMyHomeworks(req.user.student.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Get('my-homeworks/:id')
  findMyHomework(@Req() req: any, @Param('id') homeworkId: string) {
    if (!req.user.student) {
      throw new ForbiddenException(
        'Для пользователя не создан профиль обучающегося',
      );
    }

    return this.service.findMyHomework(homeworkId, req.user.student.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Post(':id/pass')
  passHomework(
    @Req() req: any,
    @Param('id') homeworkId: string,
    @Body()
    dto: {
      content: string;
      answer: string;
    },
  ) {
    if (!req.user.student) {
      throw new ForbiddenException(
        'Для пользователя не создан профиль обучающегося',
      );
    }

    return this.service.passHomework(homeworkId, req.user.student.id, dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
