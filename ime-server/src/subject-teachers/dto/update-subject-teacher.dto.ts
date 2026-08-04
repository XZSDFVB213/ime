import { PartialType } from '@nestjs/swagger';
import { CreateSubjectTeacherDto } from './create-subject-teacher.dto';

export class UpdateSubjectTeacherDto extends PartialType(CreateSubjectTeacherDto) {}
