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

interface Department {
  id: string;
  name: string;
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

    departmentId?: string | null;

    department?: Department | null;
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

  readonly loading = signal(true);

  readonly search = signal('');

  readonly departmentFilter = signal('ALL');

  readonly filteredTeachers = computed(() => {
    const search = this.search().trim().toLowerCase();

    const department = this.departmentFilter();

    return this.teachers().filter((teacher) => {
      if (department !== 'ALL' && teacher.teacher?.department?.id !== department) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        teacher.fullName.toLowerCase().includes(search) ||
        teacher.email.toLowerCase().includes(search) ||
        teacher.phone?.toLowerCase().includes(search) ||
        teacher.teacher?.position?.toLowerCase().includes(search) ||
        teacher.teacher?.department?.name?.toLowerCase().includes(search)
      );
    });
  });

  readonly activeCount = computed(
    () => this.teachers().filter((teacher) => teacher.status === 'ACTIVE').length,
  );

  readonly withoutDepartmentCount = computed(
    () => this.teachers().filter((teacher) => !teacher.teacher?.department).length,
  );

  readonly departmentsCount = computed(() => {
    return new Set(
      this.teachers()
        .map((teacher) => teacher.teacher?.department?.id)
        .filter(Boolean),
    ).size;
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
