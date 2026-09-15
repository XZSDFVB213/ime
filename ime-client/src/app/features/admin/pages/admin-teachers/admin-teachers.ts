import { Component, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MatSelectModule } from '@angular/material/select';

import { forkJoin } from 'rxjs';

import { AdminService } from '../../services/admin.service';

import { CreateTeacherDialog } from './create-teacher-dialog/create-teacher-dialog';

import { TeacherAssignmentsDialogComponent } from '../../components/teacher-assignments-dialog/teacher-assignments-dialog';
import { EditTeacherDialog } from './edit-teacher-dialog/edit-teacher-dialog';

interface Department {
  id: string;
  name: string;
}

interface TeacherDepartment {
  department: Department;
}

interface AdminTeacher {
  id: string;

  fullName: string;
  email: string;

  phone?: string | null;

  status: string;

  roles: {
    role: string;
  }[];

  teacher: {
    id: string;

    position?: string | null;

    departments: TeacherDepartment[];
  } | null;
}
@Component({
  selector: 'app-admin-teachers',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,

    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
  ],

  templateUrl: './admin-teachers.html',

  styleUrl: './admin-teachers.scss',
})
export class AdminTeachers {
  private readonly adminService = inject(AdminService);

  private readonly dialog = inject(MatDialog);

  private readonly snackBar = inject(MatSnackBar);

  readonly teachers = signal<AdminTeacher[]>([]);

  readonly departments = signal<Department[]>([]);
  readonly deletingTeacherId = signal<string | null>(null);
  readonly loading = signal(true);

  readonly search = signal('');

  readonly departmentFilter = signal('ALL');
  deleteTeacher(teacher: AdminTeacher): void {
    if (!teacher.teacher?.id) {
      return;
    }

    const confirmed = confirm(`Удалить преподавателя «${teacher.fullName}»?`);

    if (!confirmed) {
      return;
    }

    this.deletingTeacherId.set(teacher.teacher.id);

    this.adminService.deleteTeacher(teacher.teacher.id).subscribe({
      next: () => {
        this.teachers.update((teachers) => teachers.filter((item) => item.id !== teacher.id));

        this.deletingTeacherId.set(null);

        this.snackBar.open('Преподаватель удалён', 'OK', {
          duration: 2500,
        });
      },

      error: (error) => {
        console.error(error);

        this.deletingTeacherId.set(null);

        this.snackBar.open(error.error?.message ?? 'Не удалось удалить преподавателя', 'Закрыть', {
          duration: 3500,
        });
      },
    });
  }
  openEditTeacher(teacher: AdminTeacher): void {
    if (!teacher.teacher) {
      this.snackBar.open('У преподавателя отсутствует профиль Teacher', 'Закрыть', {
        duration: 3000,
      });

      return;
    }

    const dialogRef = this.dialog.open(EditTeacherDialog, {
      width: '560px',

      maxWidth: 'calc(100vw - 32px)',

      autoFocus: false,

      data: {
        teacherId: teacher.teacher.id,

        fullName: teacher.fullName,

        email: teacher.email,

        phone: teacher.phone,

        position: teacher.teacher.position,

        /*
         * Вот главное изменение.
         */
        departmentIds: teacher.teacher.departments.map((item) => item.department.id),

        departments: this.departments(),
      },
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.load();
      }
    });
  }
  readonly filteredTeachers = computed(() => {
    const search = this.search().trim().toLowerCase();

    const department = this.departmentFilter();

    return this.teachers().filter((teacher) => {
      /*
       * Фильтр по кафедре.
       *
       * Преподаватель подходит,
       * если состоит хотя бы
       * в одной выбранной кафедре.
       */
      if (
        department !== 'ALL' &&
        !teacher.teacher?.departments?.some((item) => item.department.id === department)
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const matchesDepartment = teacher.teacher?.departments?.some((item) =>
        item.department.name.toLowerCase().includes(search),
      );

      return (
        teacher.fullName.toLowerCase().includes(search) ||
        teacher.email.toLowerCase().includes(search) ||
        teacher.phone?.toLowerCase().includes(search) ||
        teacher.teacher?.position?.toLowerCase().includes(search) ||
        matchesDepartment
      );
    });
  });

  readonly activeCount = computed(
    () => this.teachers().filter((teacher) => teacher.status === 'ACTIVE').length,
  );

  readonly withoutDepartmentCount = computed(
    () => this.teachers().filter((teacher) => !teacher.teacher?.departments?.length).length,
  );

  readonly departmentsCount = computed(() => {
    const ids = this.teachers().flatMap(
      (teacher) => teacher.teacher?.departments?.map((item) => item.department.id) ?? [],
    );

    return new Set(ids).size;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    forkJoin({
      teachers: this.adminService.getTeachers(),

      departments: this.adminService.getDepartments(),
    }).subscribe({
      next: ({ teachers, departments }) => {
        this.teachers.set(teachers as AdminTeacher[]);

        this.departments.set(departments as Department[]);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Ошибка загрузки преподавателей:', error);

        this.loading.set(false);

        this.snackBar.open('Не удалось загрузить преподавателей', 'Закрыть', {
          duration: 3500,
        });
      },
    });
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setDepartmentFilter(value: string): void {
    this.departmentFilter.set(value);
  }

  openCreateTeacher(): void {
    const dialogRef = this.dialog.open(CreateTeacherDialog, {
      width: '560px',

      maxWidth: 'calc(100vw - 32px)',

      autoFocus: false,

      data: {
        departments: this.departments(),
      },
    });

    dialogRef.afterClosed().subscribe((created) => {
      if (created) {
        this.load();
      }
    });
  }

  openAssignments(teacher: AdminTeacher): void {
    if (!teacher.teacher?.id) {
      this.snackBar.open('У преподавателя отсутствует профиль Teacher', 'Закрыть', {
        duration: 3000,
      });

      return;
    }

    this.dialog.open(TeacherAssignmentsDialogComponent, {
      width: '760px',

      maxWidth: 'calc(100vw - 32px)',

      maxHeight: '90vh',

      autoFocus: false,

      data: {
        teacherId: teacher.teacher.id,

        fullName: teacher.fullName,
      },
    });
  }

  initials(fullName: string): string {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }
}
