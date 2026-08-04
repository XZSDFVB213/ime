import { IsNumber } from 'class-validator';

export class CreateAcademicYearDto {
  @IsNumber()
  year!: number;
}
