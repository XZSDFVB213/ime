import { IsString } from 'class-validator';

export class CreateSubjectTeacherDto {
  @IsString()
  subjectId!: string;

  @IsString()
  teacherId!: string;
}
