import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFileMaterialDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  subjectId!: string;

  @IsOptional()
  @IsString()
  lessonId?: string;
}
