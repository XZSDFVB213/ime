// create-portfolio-item.dto.ts

import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PortfolioItemType } from '@prisma/client';

export class CreatePortfolioItemDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PortfolioItemType)
  type!: PortfolioItemType;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  url?: string;
}
