import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Role, UserStatus } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma.service';

import { CreateStudentDto } from './dto/create-student.dto';

import { CreateTeacherDto } from './dto/create-teacher.dto';

import { AssignStudentGroupDto } from './dto/assign-student-group.dto';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateDepartmentDto } from './dto/create-departament.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';

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
  async deleteSubject(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Дисциплина не найдена');
    }

    const [lessons, materials, homeworks, assignments] = await Promise.all([
      this.prisma.lesson.count({
        where: {
          subjectId,
        },
      }),

      this.prisma.material.count({
        where: {
          subjectId,
        },
      }),

      this.prisma.homework.count({
        where: {
          subjectId,
        },
      }),

      this.prisma.teacherDisciplineGroup.count({
        where: {
          subjectId,
        },
      }),
    ]);

    if (lessons > 0 || materials > 0 || homeworks > 0 || assignments > 0) {
      throw new ConflictException(
        'Нельзя удалить дисциплину: она используется в учебном процессе',
      );
    }

    await this.prisma.subject.delete({
      where: {
        id: subjectId,
      },
    });

    return {
      success: true,
    };
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
    return this.prisma.teacherDisciplineGroup.findMany({
      where: {
        teacherId,
      },

      include: {
        subject: true,
        group: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async assignTeacher(
    teacherId: string,
    dto: {
      subjectId: string;
      groupId: string;
    },
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    const subject = await this.prisma.subject.findUnique({
      where: {
        id: dto.subjectId,
      },
    });

    if (!subject) {
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
        teacherId_subjectId_groupId: {
          teacherId,
          subjectId: dto.subjectId,
          groupId: dto.groupId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Эта дисциплина уже назначена преподавателю в данной группе',
      );
    }

    return this.prisma.teacherDisciplineGroup.create({
      data: {
        teacherId,
        subjectId: dto.subjectId,
        groupId: dto.groupId,
      },

      include: {
        subject: true,
        group: true,

        teacher: {
          include: {
            user: true,
          },
        },
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
        subject: true,

        teacher: {
          include: {
            user: true,

            departments: {
              include: {
                department: true,
              },
            },
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
      where: {
        status: {
          not: UserStatus.DELETED,
        },

        ...(role
          ? {
              roles: {
                some: {
                  role,
                },
              },
            }
          : {}),
      },

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
            departments: {
              include: {
                department: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createAcademicYear(dto: CreateAcademicYearDto) {
    const existing = await this.prisma.academicYear.findUnique({
      where: {
        year: dto.year,
      },

      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Учебный год ${dto.year}/${dto.year + 1} уже существует`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const academicYear = await tx.academicYear.create({
        data: {
          year: dto.year,
        },
      });

      await tx.semester.createMany({
        data: [
          {
            name: '1 семестр',
            number: 1,
            academicYearId: academicYear.id,
          },

          {
            name: '2 семестр',
            number: 2,
            academicYearId: academicYear.id,
          },
        ],
      });

      return tx.academicYear.findUnique({
        where: {
          id: academicYear.id,
        },

        include: {
          semesters: {
            orderBy: {
              number: 'asc',
            },
          },
        },
      });
    });
  }

  getAcademicYears() {
    return this.prisma.academicYear.findMany({
      include: {
        semesters: {
          orderBy: {
            number: 'asc',
          },
        },
      },

      orderBy: {
        year: 'desc',
      },
    });
  }
  getSemesters() {
    return this.prisma.semester.findMany({
      include: {
        academicYear: true,
      },

      orderBy: [
        {
          academicYear: {
            year: 'desc',
          },
        },
        {
          number: 'asc',
        },
      ],
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
  async updateTeacher(teacherId: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },

      include: {
        user: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    if (dto.departmentIds) {
      const uniqueIds = [...new Set(dto.departmentIds)];

      const departments = await this.prisma.department.findMany({
        where: {
          id: {
            in: uniqueIds,
          },
        },

        select: {
          id: true,
        },
      });

      if (departments.length !== uniqueIds.length) {
        throw new NotFoundException('Одна или несколько кафедр не найдены');
      }
    }

    if (dto.email && dto.email !== teacher.user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: {
          email: dto.email.trim(),
        },
      });

      if (emailExists) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
    }

    let passwordHash: string | undefined;

    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: teacher.userId,
        },

        data: {
          ...(dto.fullName !== undefined
            ? {
                fullName: dto.fullName.trim(),
              }
            : {}),

          ...(dto.email !== undefined
            ? {
                email: dto.email.trim().toLowerCase(),
              }
            : {}),

          ...(dto.phone !== undefined
            ? {
                phone: dto.phone.trim() || null,
              }
            : {}),

          ...(passwordHash
            ? {
                password: passwordHash,
              }
            : {}),
        },
      });

      await tx.teacher.update({
        where: {
          id: teacherId,
        },

        data: {
          ...(dto.position !== undefined
            ? {
                position: dto.position.trim() || null,
              }
            : {}),
        },
      });

      /*
       * departmentIds === undefined
       * => кафедры вообще не меняем.
       *
       * departmentIds === []
       * => снимаем преподавателя
       * со всех кафедр.
       */
      if (dto.departmentIds !== undefined) {
        await tx.teacherDepartment.deleteMany({
          where: {
            teacherId,
          },
        });

        if (dto.departmentIds.length > 0) {
          await tx.teacherDepartment.createMany({
            data: dto.departmentIds.map((departmentId) => ({
              teacherId,
              departmentId,
            })),

            skipDuplicates: true,
          });
        }
      }
    });
    return this.prisma.user.findUnique({
      where: {
        id: teacher.userId,
      },

      include: {
        roles: true,

        teacher: {
          include: {
            departments: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });
  }
  async deleteTeacher(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },

      select: {
        id: true,
        userId: true,

        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    await this.prisma.$transaction([
      /*
       * Убираем текущие назначения
       * дисциплина + группа.
       *
       * Lesson/Material и историю
       * НЕ трогаем.
       */
      this.prisma.teacherDisciplineGroup.deleteMany({
        where: {
          teacherId,
        },
      }),

      this.prisma.user.update({
        where: {
          id: teacher.userId,
        },

        data: {
          status: 'DELETED',
        },
      }),
    ]);

    return {
      success: true,
    };
  }
  async createTeacher(dto: CreateTeacherDto) {
    const email = dto.email.trim().toLowerCase();

    await this.ensureEmailAvailable(email);

    if (dto.departmentIds) {
      const uniqueIds = [...new Set(dto.departmentIds)];

      const departments = await this.prisma.department.findMany({
        where: {
          id: {
            in: uniqueIds,
          },
        },

        select: {
          id: true,
        },
      });

      if (departments.length !== uniqueIds.length) {
        throw new NotFoundException('Одна или несколько кафедр не найдены');
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

            departments: {
              create: (dto.departmentIds ?? []).map((departmentId) => ({
                department: {
                  connect: {
                    id: departmentId,
                  },
                },
              })),
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

        teacher: {
          include: {
            departments: {
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
  async updateStudent(studentId: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId,
      },

      include: {
        user: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Студент не найден');
    }

    if (dto.groupId) {
      const group = await this.prisma.group.findUnique({
        where: {
          id: dto.groupId,
        },
      });

      if (!group) {
        throw new NotFoundException('Группа не найдена');
      }
    }

    if (dto.email && dto.email.trim() !== student.user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: {
          email: dto.email.trim(),
        },
      });

      if (emailExists) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
    }

    let passwordHash: string | undefined;

    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: student.userId,
        },

        data: {
          ...(dto.fullName !== undefined
            ? {
                fullName: dto.fullName.trim(),
              }
            : {}),

          ...(dto.email !== undefined
            ? {
                email: dto.email.trim(),
              }
            : {}),

          ...(dto.phone !== undefined
            ? {
                phone: dto.phone.trim() || null,
              }
            : {}),

          ...(passwordHash
            ? {
                password: passwordHash,
              }
            : {}),
        },
      }),

      this.prisma.student.update({
        where: {
          id: studentId,
        },

        data: {
          ...(dto.groupId !== undefined
            ? {
                groupId: dto.groupId,
              }
            : {}),
        },
      }),
    ]);

    return this.prisma.user.findUnique({
      where: {
        id: student.userId,
      },

      include: {
        roles: true,

        student: {
          include: {
            group: true,
          },
        },
      },
    });
  }
  async deleteStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId,
      },

      select: {
        id: true,
        userId: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Студент не найден');
    }

    await this.prisma.user.update({
      where: {
        id: student.userId,
      },

      data: {
        status: UserStatus.DELETED,
      },
    });

    return {
      success: true,
    };
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
