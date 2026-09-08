import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Role } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma.service';

import { CreateStudentDto } from './dto/create-student.dto';

import { CreateTeacherDto } from './dto/create-teacher.dto';

import { AssignStudentGroupDto } from './dto/assign-student-group.dto';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateDepartmentDto } from './dto/create-departament.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateFacultyDto } from './dto/create-faculty.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
  // =========================
  // DISCIPLINES
  // =========================
  async getDepartments() {
    return this.prisma.department.findMany({
      include: {
        faculty: true,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }
  async getDisciplines() {
    const disciplines = await this.prisma.discipline.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return disciplines;
  }

  async createDiscipline(dto: CreateDisciplineDto) {
    const existing = await this.prisma.discipline.findFirst({
      where: {
        name: {
          equals: dto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Дисциплина с таким названием уже существует',
      );
    }

    return this.prisma.discipline.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
      },
    });
  }
  async getTeacherAssignments(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    return this.prisma.teacherDisciplineGroup.findMany({
      where: {
        teacherId,
      },

      include: {
        discipline: true,
        group: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async assignTeacher(teacherId: string, dto: AssignTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    const discipline = await this.prisma.discipline.findUnique({
      where: {
        id: dto.disciplineId,
      },
    });

    if (!discipline) {
      throw new NotFoundException('Дисциплина не найдена');
    }

    const group = await this.prisma.group.findUnique({
      where: {
        id: dto.groupId,
      },
    });

    if (!group) {
      throw new NotFoundException('Группа не найдена');
    }

    const existing = await this.prisma.teacherDisciplineGroup.findUnique({
      where: {
        teacherId_disciplineId_groupId: {
          teacherId,
          disciplineId: dto.disciplineId,
          groupId: dto.groupId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Преподаватель уже назначен на эту дисциплину в данной группе',
      );
    }

    return this.prisma.teacherDisciplineGroup.create({
      data: {
        teacherId,
        disciplineId: dto.disciplineId,
        groupId: dto.groupId,
      },

      include: {
        discipline: true,
        group: true,
      },
    });
  }
  async deleteTeacherAssignment(teacherId: string, assignmentId: string) {
    const assignment = await this.prisma.teacherDisciplineGroup.findFirst({
      where: {
        id: assignmentId,
        teacherId,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Назначение не найдено');
    }

    await this.prisma.teacherDisciplineGroup.delete({
      where: {
        id: assignmentId,
      },
    });

    return {
      message: 'Назначение удалено',
    };
  }
  async getGroupAssignments(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: {
        id: groupId,
      },

      select: {
        id: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Группа не найдена');
    }

    return this.prisma.teacherDisciplineGroup.findMany({
      where: {
        groupId,
      },

      include: {
        discipline: true,

        teacher: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },

            department: true,
          },
        },

        group: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  // ==========================================
  // USERS
  // ==========================================

  async findUsers(role?: Role) {
    return this.prisma.user.findMany({
      where: role
        ? {
            roles: {
              some: {
                role,
              },
            },
          }
        : undefined,

      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        status: true,
        createdAt: true,

        roles: {
          select: {
            role: true,
          },
        },

        student: {
          include: {
            group: {
              include: {
                department: true,
              },
            },
          },
        },

        teacher: {
          include: {
            department: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==========================================
  // CREATE STUDENT
  // ==========================================

  async createStudent(dto: CreateStudentDto) {
    const email = dto.email.trim().toLowerCase();

    await this.ensureEmailAvailable(email);

    const group = await this.prisma.group.findUnique({
      where: {
        id: dto.groupId,
      },
    });

    if (!group) {
      throw new NotFoundException('Группа не найдена');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email,

        password: passwordHash,

        fullName: dto.fullName.trim(),

        phone: dto.phone?.trim() || null,

        roles: {
          create: {
            role: Role.STUDENT,
          },
        },

        student: {
          create: {
            group: {
              connect: {
                id: dto.groupId,
              },
            },
          },
        },
      },

      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        createdAt: true,

        roles: {
          select: {
            role: true,
          },
        },

        student: {
          include: {
            group: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });
  }

  // ==========================================
  // CREATE TEACHER
  // ==========================================

  async createTeacher(dto: CreateTeacherDto) {
    const email = dto.email.trim().toLowerCase();

    await this.ensureEmailAvailable(email);

    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: {
          id: dto.departmentId,
        },
      });

      if (!department) {
        throw new NotFoundException('Кафедра не найдена');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email,

        password: passwordHash,

        fullName: dto.fullName.trim(),

        phone: dto.phone?.trim() || null,

        roles: {
          create: {
            role: Role.TEACHER,
          },
        },

        teacher: {
          create: {
            position: dto.position?.trim() || null,

            departmentId: dto.departmentId || null,
          },
        },
      },

      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        createdAt: true,

        roles: {
          select: {
            role: true,
          },
        },

        teacher: {
          include: {
            department: true,
          },
        },
      },
    });
  }

  // ==========================================
  // ASSIGN STUDENT TO GROUP
  // ==========================================

  async assignStudentToGroup(studentId: string, dto: AssignStudentGroupDto) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!student) {
      throw new NotFoundException('Студент не найден');
    }

    const group = await this.prisma.group.findUnique({
      where: {
        id: dto.groupId,
      },
    });

    if (!group) {
      throw new NotFoundException('Группа не найдена');
    }

    return this.prisma.student.update({
      where: {
        id: studentId,
      },

      data: {
        group: {
          connect: {
            id: dto.groupId,
          },
        },
      },

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            status: true,
          },
        },

        group: {
          include: {
            department: true,
          },
        },
      },
    });
  }

  // ==========================================
  // GROUPS
  // ==========================================

  findGroups() {
    return this.prisma.group.findMany({
      include: {
        department: true,

        students: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                status: true,
              },
            },
          },
        },

        _count: {
          select: {
            students: true,
          },
        },
      },

      orderBy: {
        name: 'asc',
      },
    });
  }

  // ==========================================
  // DEPARTMENTS
  // ==========================================

  findDepartments() {
    return this.prisma.department.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  // ==========================================
  // PRIVATE
  // ==========================================

  private async ensureEmailAvailable(email: string) {
    const existing = await this.prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }
  }

  async getMaterials() {
    return this.prisma.material.findMany({
      include: {
        subject: true,

        lesson: {
          select: {
            id: true,
            title: true,
          },
        },

        teacher: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },

        uploadedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMaterialSubjects() {
    return this.prisma.subject.findMany({
      select: {
        id: true,
        name: true,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }

  async createLinkMaterial(
    adminUserId: string,

    dto: {
      title: string;
      description?: string;
      subjectId: string;
      url: string;
    },
  ) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id: dto.subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Дисциплина не найдена');
    }

    return this.prisma.material.create({
      data: {
        title: dto.title.trim(),

        description: dto.description?.trim() || null,

        type: 'LINK',

        url: dto.url.trim(),

        subjectId: dto.subjectId,

        lessonId: null,

        teacherId: null,

        uploadedByUserId: adminUserId,
      },

      include: {
        subject: true,

        uploadedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }
  async createFileMaterial(
    adminUserId: string,

    dto: {
      title: string;
      description?: string;
      subjectId: string;
    },

    file: Express.Multer.File,
  ) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id: dto.subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Дисциплина не найдена');
    }

    return this.prisma.material.create({
      data: {
        title: dto.title.trim(),

        description: dto.description?.trim() || null,

        type: 'FILE',

        url: `/uploads/materials/${file.filename}`,

        fileName: file.originalname,

        mimeType: file.mimetype,

        size: file.size,

        subjectId: dto.subjectId,

        lessonId: null,

        teacherId: null,

        uploadedByUserId: adminUserId,
      },

      include: {
        subject: true,

        uploadedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }
  async deleteMaterial(materialId: string) {
    const material = await this.prisma.material.findUnique({
      where: {
        id: materialId,
      },
    });

    if (!material) {
      throw new NotFoundException('Материал не найден');
    }

    await this.prisma.material.delete({
      where: {
        id: materialId,
      },
    });

    return {
      success: true,
    };
  }
  async getSubjects() {
    return this.prisma.subject.findMany({
      include: {
        department: true,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }
  async createSubject(dto: CreateSubjectDto) {
    const department = await this.prisma.department.findUnique({
      where: {
        id: dto.departmentId,
      },
    });

    if (!department) {
      throw new NotFoundException('Кафедра не найдена');
    }

    return this.prisma.subject.create({
      data: {
        name: dto.name.trim(),

        code: dto.code.trim(),

        description: dto.description?.trim() || null,

        credits: dto.credits,

        departmentId: dto.departmentId,
      },

      include: {
        department: true,
      },
    });
  }
  async getGroups() {
    return this.prisma.group.findMany({
      include: {
        department: {
          include: {
            faculty: true,
          },
        },

        students: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },

        _count: {
          select: {
            students: true,
          },
        },
      },

      orderBy: {
        name: 'asc',
      },
    });
  }
  async createDepartment(dto: CreateDepartmentDto) {
    const name = dto.name.trim();

    const faculty = await this.prisma.faculty.findUnique({
      where: {
        id: dto.facultyId,
      },
    });

    if (!faculty) {
      throw new NotFoundException('Факультет / направление не найдено');
    }

    const exists = await this.prisma.department.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },

        facultyId: dto.facultyId,
      },
    });

    if (exists) {
      throw new BadRequestException(
        'Такая кафедра уже существует в этом направлении',
      );
    }

    return this.prisma.department.create({
      data: {
        name,

        faculty: {
          connect: {
            id: dto.facultyId,
          },
        },
      },

      include: {
        faculty: true,
      },
    });
  }
  async getFaculties() {
    return this.prisma.faculty.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createFaculty(dto: CreateFacultyDto) {
    const name = dto.name.trim();

    const shortName = dto.shortName.trim();

    const exists = await this.prisma.faculty.findFirst({
      where: {
        OR: [
          {
            name: {
              equals: name,
              mode: 'insensitive',
            },
          },

          {
            shortName: {
              equals: shortName,
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    if (exists) {
      throw new BadRequestException(
        'Факультет с таким названием или сокращением уже существует',
      );
    }

    return this.prisma.faculty.create({
      data: {
        name,
        shortName,
      },
    });
  }
  async updateSubject(subjectId: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Дисциплина не найдена');
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: {
          id: dto.departmentId,
        },
      });

      if (!department) {
        throw new NotFoundException('Кафедра не найдена');
      }
    }

    return this.prisma.subject.update({
      where: {
        id: subjectId,
      },

      data: {
        ...(dto.name !== undefined
          ? {
              name: dto.name.trim(),
            }
          : {}),

        ...(dto.code !== undefined
          ? {
              code: dto.code.trim(),
            }
          : {}),

        ...(dto.description !== undefined
          ? {
              description: dto.description.trim() || null,
            }
          : {}),

        ...(dto.credits !== undefined
          ? {
              credits: dto.credits,
            }
          : {}),

        ...(dto.departmentId !== undefined
          ? {
              departmentId: dto.departmentId,
            }
          : {}),
      },

      include: {
        department: true,
      },
    });
  }
  async createGroup(dto: CreateGroupDto) {
    const name = dto.name.trim();

    const department = await this.prisma.department.findUnique({
      where: {
        id: dto.departmentId,
      },
    });

    if (!department) {
      throw new NotFoundException('Кафедра не найдена');
    }

    const exists = await this.prisma.group.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },

        departmentId: dto.departmentId,
      },
    });

    if (exists) {
      throw new BadRequestException('Такая группа уже существует');
    }

    return this.prisma.group.create({
      data: {
        name,

        departmentId: dto.departmentId,
      },

      include: {
        department: true,

        _count: {
          select: {
            students: true,
          },
        },
      },
    });
  }
}
