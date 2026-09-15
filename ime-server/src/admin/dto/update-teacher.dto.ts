import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ArrayUnique,
  IsArray,
} from 'class-validator';

export class UpdateTeacherDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({
    each: true,
  })
  departmentIds?: string[];

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
