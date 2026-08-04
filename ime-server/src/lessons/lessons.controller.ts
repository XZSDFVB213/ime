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
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
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
