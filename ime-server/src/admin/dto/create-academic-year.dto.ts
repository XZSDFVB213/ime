import {
  IsInt,
  Max,
  Min,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';


export class CreateAcademicYearDto {
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;
}