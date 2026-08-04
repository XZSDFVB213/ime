import { LessonType } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @IsString()
  @IsNotEmpty()
  teacherId!: string;

  @IsString()
  @IsNotEmpty()
  semesterId!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsEnum(LessonType)
  type!: LessonType;

  @IsISO8601()
  date!: string; // ISO строка, например "2026-09-15T10:00:00.000Z"

  @IsInt()
  @Min(15)
  @Type(() => Number)
  duration!: number; // в минутах

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string; // аудитория
}
