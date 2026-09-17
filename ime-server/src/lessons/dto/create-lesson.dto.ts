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
  date!: string;


  @IsInt()
  @Min(15)
  @Type(() => Number)
  duration!: number;


  @IsOptional()
  @IsString()
  description?: string;


  @IsOptional()
  @IsString()
  location?: string;
}