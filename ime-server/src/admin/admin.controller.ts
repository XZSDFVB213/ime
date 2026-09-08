import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';

import { Role } from '@prisma/client';

import { AdminService } from './admin.service';

import { CreateStudentDto } from './dto/create-student.dto';

import { CreateTeacherDto } from './dto/create-teacher.dto';

import { AssignStudentGroupDto } from './dto/assign-student-group.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';

import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname } from 'path';

import { randomUUID } from 'crypto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateDepartmentDto } from './dto/create-departament.dto';
import { CreateFacultyDto } from './dto/create-faculty.dto';
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Get('disciplines')
  getDisciplines() {
    return this.adminService.getDisciplines();
  }
  @Get('faculties')
  getFaculties() {
    return this.adminService.getFaculties();
  }

  @Post('faculties')
  createFaculty(
    @Body()
    dto: CreateFacultyDto,
  ) {
    return this.adminService.createFaculty(dto);
  }

  @Get('departments')
  getDepartments() {
    return this.adminService.getDepartments();
  }

  @Post('departments')
  createDepartment(
    @Body()
    dto: CreateDepartmentDto,
  ) {
    return this.adminService.createDepartment(dto);
  }

  @Get('groups')
  getGroups() {
    return this.adminService.getGroups();
  }

  @Post('groups')
  createGroup(
    @Body()
    dto: CreateGroupDto,
  ) {
    return this.adminService.createGroup(dto);
  }
  @Post('disciplines')
  createDiscipline(@Body() dto: CreateDisciplineDto) {
    return this.adminService.createDiscipline(dto);
  }
  @Get('materials')
  getMaterials() {
    return this.adminService.getMaterials();
  }
  @Get('subjects')
  getSubjects() {
    return this.adminService.getSubjects();
  }

  @Post('subjects')
  createSubject(
    @Body()
    dto: CreateSubjectDto,
  ) {
    return this.adminService.createSubject(dto);
  }

  @Patch('subjects/:subjectId')
  updateSubject(
    @Param('subjectId')
    subjectId: string,

    @Body()
    dto: UpdateSubjectDto,
  ) {
    return this.adminService.updateSubject(subjectId, dto);
  }
  @Get('material-subjects')
  getMaterialSubjects() {
    return this.adminService.getMaterialSubjects();
  }

  @Post('materials/link')
  createLinkMaterial(
    @CurrentUser('id')
    userId: string,

    @Body()
    dto: {
      title: string;
      description?: string;
      subjectId: string;
      url: string;
    },
  ) {
    return this.adminService.createLinkMaterial(userId, dto);
  }

  @Post('materials/file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/materials',

        filename: (request, file, callback) => {
          const extension = extname(file.originalname);

          callback(null, `${randomUUID()}${extension}`);
        },
      }),
    }),
  )
  createFileMaterial(
    @CurrentUser('id')
    userId: string,

    @Body()
    dto: {
      title: string;
      description?: string;
      subjectId: string;
    },

    @UploadedFile()
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }

    return this.adminService.createFileMaterial(userId, dto, file);
  }

  @Delete('materials/:materialId')
  deleteMaterial(
    @Param('materialId')
    materialId: string,
  ) {
    return this.adminService.deleteMaterial(materialId);
  }
  // GET /admin/users
  // GET /admin/users?role=STUDENT

  @Get('users')
  findUsers(
    @Query('role')
    role?: Role,
  ) {
    return this.adminService.findUsers(role);
  }

  // POST /admin/students

  @Post('students')
  createStudent(
    @Body()
    dto: CreateStudentDto,
  ) {
    return this.adminService.createStudent(dto);
  }

  // POST /admin/teachers

  @Post('teachers')
  createTeacher(
    @Body()
    dto: CreateTeacherDto,
  ) {
    return this.adminService.createTeacher(dto);
  }

  // PATCH /admin/students/:id/group

  @Patch('students/:studentId/group')
  assignStudentToGroup(
    @Param('studentId')
    studentId: string,

    @Body()
    dto: AssignStudentGroupDto,
  ) {
    return this.adminService.assignStudentToGroup(studentId, dto);
  }
  @Get('teachers/:teacherId/assignments')
  getTeacherAssignments(@Param('teacherId') teacherId: string) {
    return this.adminService.getTeacherAssignments(teacherId);
  }
  @Post('teachers/:teacherId/assignments')
  assignTeacher(
    @Param('teacherId') teacherId: string,
    @Body() dto: AssignTeacherDto,
  ) {
    return this.adminService.assignTeacher(teacherId, dto);
  }
  @Delete('teachers/:teacherId/assignments/:assignmentId')
  deleteTeacherAssignment(
    @Param('teacherId') teacherId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.adminService.deleteTeacherAssignment(teacherId, assignmentId);
  }

  // GET /admin/groups
  @Get('groups/:groupId/assignments')
  getGroupAssignments(
    @Param('groupId')
    groupId: string,
  ) {
    return this.adminService.getGroupAssignments(groupId);
  }
  @Get('groups')
  findGroups() {
    return this.adminService.findGroups();
  }

  // GET /admin/departments

  @Get('departments')
  findDepartments() {
    return this.adminService.findDepartments();
  }
}
