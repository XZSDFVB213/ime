import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ArrayUnique,
  IsArray,
} from 'class-validator';

export class CreateTeacherDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

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
}
