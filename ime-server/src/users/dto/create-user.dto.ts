import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(Role)
  role!: Role;
  @IsOptional()
  groupId?: string;
}
