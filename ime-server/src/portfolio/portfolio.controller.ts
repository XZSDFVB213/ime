/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname } from 'path';

import { randomUUID } from 'crypto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { PortfolioService } from './portfolio.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreatePortfolioItemDto } from './dto/create-portfolio.dto';
@Controller('portfolio')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  findMine(@CurrentUser() user: any) {
    return this.portfolioService.findMyPortfolio(user.student.id);
  }

  @Post('link')
  createLink(
    @CurrentUser() user: any,

    @Body()
    dto: CreatePortfolioItemDto,
  ) {
    return this.portfolioService.createLink(user.student.id, {
      ...dto,

      url: dto.url!,
    });
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/portfolio',

        filename: (request, file, callback) => {
          const extension = extname(file.originalname);

          callback(null, `${randomUUID()}${extension}`);
        },
      }),
    }),
  )
  createFile(
    @CurrentUser() user: any,

    @Body()
    dto: CreatePortfolioItemDto,

    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.portfolioService.createFile(user.student.id, dto, file);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: any,

    @Param('id')
    id: string,
  ) {
    return this.portfolioService.remove(user.student.id, id);
  }
}
