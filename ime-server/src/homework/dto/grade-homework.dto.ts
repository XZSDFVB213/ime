import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class GradeHomeworkDto {
  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
