/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { Role } from '@prisma/client';

import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname } from 'path';

import { mkdirSync } from 'fs';

import { MaterialsService } from './materials.service';

import { CreateLinkMaterialDto } from './dto/create-link-material.dto';

import { CreateFileMaterialDto } from './dto/create-file-material.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

const materialsDirectory = './uploads/materials';

mkdirSync(materialsDirectory, {
  recursive: true,
});

@Controller('materials')
export class MaterialsController {
  constructor(private readonly service: MaterialsService) {}

  /*
   * ========= TEACHER =========
   */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Post('link')
  createLink(
    @Req() req: any,
    @Body()
    dto: CreateLinkMaterialDto,
  ) {
    return this.service.createLink(req.user.teacher.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: materialsDirectory,

        filename: (_req, file, callback) => {
          const extension = extname(file.originalname);

          const filename = `${Date.now()}-${Math.round(
            Math.random() * 1_000_000_000,
          )}${extension}`;

          callback(null, filename);
        },
      }),

      limits: {
        /*
         * Пока максимум 50 MB.
         */
        fileSize: 50 * 1024 * 1024,
      },

      fileFilter: (_req, file, callback) => {
        const allowed = [
          'application/pdf',

          'application/msword',

          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

          'application/vnd.ms-powerpoint',

          'application/vnd.openxmlformats-officedocument.presentationml.presentation',

          'application/vnd.ms-excel',

          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

          'image/jpeg',
          'image/png',
          'image/webp',

          'application/zip',
          'application/x-zip-compressed',

          'text/plain',
        ];

        if (!allowed.includes(file.mimetype)) {
          return callback(new Error('Недопустимый тип файла'), false);
        }

        callback(null, true);
      },
    }),
  )
  createFile(
    @Req() req: any,

    @UploadedFile()
    file: Express.Multer.File,

    @Body()
    dto: CreateFileMaterialDto,
  ) {
    return this.service.createFile(req.user.teacher.id, dto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Get('teacher/my-materials')
  findTeacherMaterials(@Req() req: any) {
    return this.service.findMyTeacherMaterials(req.user.teacher.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Get('teacher/subject/:subjectId')
  findSubjectMaterials(
    @Req() req: any,
    @Param('subjectId')
    subjectId: string,
  ) {
    return this.service.findTeacherSubjectMaterials(
      req.user.teacher.id,
      subjectId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id')
    materialId: string,
  ) {
    return this.service.remove(req.user.teacher.id, materialId);
  }

  /*
   * ========= STUDENT =========
   */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Get('my-materials')
  findStudentMaterials(@Req() req: any) {
    return this.service.findMyStudentMaterials(req.user.student.id);
  }
}
