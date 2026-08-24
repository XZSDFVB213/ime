import { IsString, IsDateString, IsInt, Min } from 'class-validator';

export class CreateHomeworkDto {
  @IsString()
  lessonId!: string;

  @IsString()
  subjectId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsDateString()
  deadline!: string;

  @IsInt()
  @Min(1)
  maxScore!: number;
}
