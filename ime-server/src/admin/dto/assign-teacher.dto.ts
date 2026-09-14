import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class AssignTeacherDto {
  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;
}