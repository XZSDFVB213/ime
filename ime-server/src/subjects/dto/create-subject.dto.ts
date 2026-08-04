import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  credits!: number;

  @IsString()
  departmentId!: string;
}
