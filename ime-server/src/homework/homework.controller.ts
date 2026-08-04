/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { HomeworksService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { PassHomeworkDto } from './dto/pass-homework.dto';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GradeHomeworkDto } from './dto/grade-homework.dto';

@Controller('homeworks')
export class HomeworksController {
  constructor(private readonly service: HomeworksService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Post()
  create(@Req() req, @Body() dto: CreateHomeworkDto) {
    return this.service.create(req.user.teacher.id, dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Post(':id/pass')
  pass(
    @Param('id') homeworkId: string,
    @Body() dto: PassHomeworkDto,
    @Req() req,
  ) {
    console.log(req.user);

    return this.service.passHomework(homeworkId, req.user.student.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Get('my-homeworks')
  findMy(@Req() req) {
    return this.service.findMy(req.user.student.id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Get('teacher/my-homeworks')
  findTeacherHomeworks(@Req() req) {
    return this.service.findMyTeacherHomeworks(req.user.teacher.id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Patch('submissions/:id/grade')
  grade(
    @Param('id') submissionId: string,
    @Body() dto: GradeHomeworkDto,
    @Req() req,
  ) {
    return this.service.gradeSubmission(submissionId, req.user.teacher.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Get('my-homeworks')
  findMyHomeworks(@Req() req) {
    return this.service.findMyHomeworks(req.user.student.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Get('my-grades')
  studentGrades(@Req() req) {
    return this.service.studentGrades(req.user.student.id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('teacher/my-homeworks')
  @Roles(Role.TEACHER)
  findMyHomeworksTeacher(@Req() req) {
    return this.service.findMyHomeworksTeacher(req.user.teacher.id);
  }
}
