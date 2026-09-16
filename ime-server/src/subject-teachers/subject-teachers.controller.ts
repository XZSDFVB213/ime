import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SubjectTeachersService } from './subject-teachers.service';
import { CreateSubjectTeacherDto } from './dto/create-subject-teacher.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
// import { UpdateSubjectTeacherDto } from './dto/update-subject-teacher.dto';

@Controller('subject-teachers')
export class SubjectTeachersController {
  constructor(
    private readonly subjectTeachersService: SubjectTeachersService,
  ) {}
  @Get('subjects')
  getSubjects(
    @CurrentUser()
    user: any,
  ) {
    return this.subjectTeachersService.getSubjects(user.id);
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
