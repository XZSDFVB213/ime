import { Component, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MatSelectModule } from '@angular/material/select';

import { AdminService } from '../../services/admin.service';

import { CreateStudentDialog } from './create-student-dialog/create-student-dialog';

interface AdminGroup {
  id: string;
  name: string;

  department?: {
    id: string;
    name: string;
  } | null;
}

interface AdminStudent {
  id: string;

  fullName: string;
  email: string;
  phone?: string | null;

  status: string;

  roles: {
    role: string;
  }[];

  student: {
    id: string;

    groupId?: string | null;

    group?: AdminGroup | null;
  } | null;
}

@Component({
  selector: 'app-admin-students',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,

    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
  ],

  templateUrl: './admin-students.html',

  styleUrl: './admin-students.scss',
})
export class AdminStudents {
  private readonly adminService = inject(AdminService);

  private readonly dialog = inject(MatDialog);

  private readonly snackBar = inject(MatSnackBar);

  readonly students = signal<AdminStudent[]>([]);

  readonly groups = signal<AdminGroup[]>([]);

  readonly loading = signal(true);

  readonly search = signal('');

  readonly groupFilter = signal<string>('ALL');

  readonly changingGroupId = signal<string | null>(null);

  readonly filteredStudents = computed(() => {
    const search = this.search().trim().toLowerCase();

    const groupFilter = this.groupFilter();

    return this.students().filter((student) => {
      if (groupFilter !== 'ALL' && student.student?.group?.id !== groupFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        student.fullName.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search) ||
        student.phone?.toLowerCase().includes(search) ||
        student.student?.group?.name?.toLowerCase().includes(search)
      );
    });
  });

  readonly activeCount = computed(
    () => this.students().filter((student) => student.status === 'ACTIVE').length,
  );

  readonly withoutGroupCount = computed(
    () => this.students().filter((student) => !student.student?.group).length,
  );

  readonly groupsCount = computed(() => {
    const ids = new Set(
      this.students()
        .map((student) => student.student?.group?.id)
        .filter(Boolean),
    );

    return ids.size;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    this.adminService.getStudents().subscribe({
      next: (students) => {
        this.students.set(students as AdminStudent[]);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Ошибка загрузки студентов:', error);

        this.loading.set(false);

        this.snackBar.open('Не удалось загрузить студентов', 'Закрыть', {
          duration: 3500,
        });
      },
    });

    this.adminService.getGroups().subscribe({
      next: (groups) => {
        this.groups.set(groups as AdminGroup[]);
      },

      error: (error) => {
        console.error('Ошибка загрузки групп:', error);
      },
    });
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setGroupFilter(value: string): void {
    this.groupFilter.set(value);
  }

  openCreateStudent(): void {
    const dialogRef = this.dialog.open(CreateStudentDialog, {
      width: '560px',

      maxWidth: 'calc(100vw - 32px)',

      autoFocus: false,

      data: {
        groups: this.groups(),
      },
    });

    dialogRef.afterClosed().subscribe((created) => {
      if (created) {
        this.load();
      }
    });
  }

  changeGroup(student: AdminStudent, groupId: string): void {
    if (!student.student || !groupId) {
      return;
    }

    if (student.student.group?.id === groupId) {
      return;
    }

    this.changingGroupId.set(student.student.id);

    this.adminService.assignStudentToGroup(student.student.id, groupId).subscribe({
      next: () => {
        this.changingGroupId.set(null);

        this.snackBar.open('Группа студента изменена', 'OK', {
          duration: 2500,
        });

        this.load();
      },

      error: (error) => {
        console.error('Ошибка изменения группы:', error);

        this.changingGroupId.set(null);

        this.snackBar.open(error.error?.message ?? 'Не удалось изменить группу', 'Закрыть', {
          duration: 3500,
        });
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
