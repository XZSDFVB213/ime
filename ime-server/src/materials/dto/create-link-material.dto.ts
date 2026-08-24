import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateLinkMaterialDto {
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

  @IsUrl()
  url!: string;
}
