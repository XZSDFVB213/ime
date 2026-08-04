import { IsOptional, IsString } from 'class-validator';

export class CreateLectureDto {
  @IsString()
  lessonId!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  slidesUrl?: string;
}
