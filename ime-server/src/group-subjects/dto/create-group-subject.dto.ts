import { IsString } from 'class-validator';

export class CreateGroupSubjectDto {
  @IsString()
  groupId!: string;

  @IsString()
  subjectId!: string;
}
