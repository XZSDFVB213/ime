import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SubjectTeachersService } from './subject-teachers.service';
import { CreateSubjectTeacherDto } from './dto/create-subject-teacher.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// import { UpdateSubjectTeacherDto } from './dto/update-subject-teacher.dto';

@Controller('subject-teachers')
export class SubjectTeachersController {
  constructor(
    private readonly subjectTeachersService: SubjectTeachersService,
  ) {}
  @Get('subjects')
  @UseGuards(JwtAuthGuard)
  getSubjects(@Req() req: any) {
    console.log('[TEACHER SUBJECTS USER]', req.user);

    return this.subjectTeachersService.getSubjects(req.user.id);
  }
  @Post()
  create(@Body() createSubjectTeacherDto: CreateSubjectTeacherDto) {
    return this.subjectTeachersService.create(createSubjectTeacherDto);
  }

  @Get()
  findAll() {
    return this.subjectTeachersService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectTeachersService.remove(id);
  }
}
