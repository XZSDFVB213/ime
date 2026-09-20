/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { AssessmentResult } from '@prisma/client';

export class LessonAssessmentItemDto {
  @IsString()
  studentId!: string;

  @IsEnum(AssessmentResult)
  result!: AssessmentResult;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class SaveLessonAssessmentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(() => LessonAssessmentItemDto)
  assessments!: LessonAssessmentItemDto[];
}
