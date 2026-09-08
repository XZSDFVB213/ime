import { IsString } from 'class-validator';

export class AssignTeacherDto {
  @IsString()
  disciplineId!: string;

  @IsString()
  groupId!: string;
}
