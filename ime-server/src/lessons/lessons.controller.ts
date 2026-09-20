/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { SaveLessonAssessmentsDto } from './dto/save-lesson-assessments.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}
  @Get('teacher/semesters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  getSemesters() {
    return this.lessonsService.getSemesters();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  create(@Req() req, @Body() dto: CreateLessonDto) {
    return this.lessonsService.create(req.user.teacher.id, dto);
  }
  @Get('by-student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  findAllByStudent(@Req() req) {
    return this.lessonsService.findAllByGroup(req.user.student.groupId);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('student/my-schedule')
  @Roles(Role.STUDENT)
  findMySchedule(@Req() req) {
    return this.lessonsService.findMySchedule(req.user.student.id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('teacher/my-lessons')
  @Roles(Role.TEACHER)
  findMyLessons(@Req() req) {
    return this.lessonsService.findMyLessons(req.user.teacher.id);
  }
  @Get('teacher/:lessonId/assessments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  getLessonAssessments(
    @Req() req,
    @Param('lessonId')
    lessonId: string,
  ) {
    return this.lessonsService.getLessonAssessments(
      req.user.teacher.id,
      lessonId,
    );
  }

  @Patch('teacher/:lessonId/assessments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  saveLessonAssessments(
    @Req() req,
    @Param('lessonId')
    lessonId: string,

    @Body()
    dto: SaveLessonAssessmentsDto,
  ) {
    return this.lessonsService.saveLessonAssessments(
      req.user.teacher.id,
      lessonId,
      dto,
    );
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  removeLesson(@Req() req: any, @Param('id') lessonId: string) {
    return this.lessonsService.removeLesson(req.user.teacher.id, lessonId);
  }
  // @Get()
  // findAll() {
  //   return this.lessonsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.lessonsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
  //   return this.lessonsService.update(+id, updateLessonDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.lessonsService.remove(+id);
  // }
}
