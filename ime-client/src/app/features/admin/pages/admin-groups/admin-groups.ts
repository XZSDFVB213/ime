import { Component, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AdminService } from '../../services/admin.service';

import { GroupDetailsDialogComponent } from './group-details-dialog/group-details-dialog';
import { CreateFacultyDialog } from './create-faculty-dialog/create-faculty-dialog';

import { CreateDepartmentDialog } from './create-departament-dialog/create-departament-dialog';

import { CreateGroupDialog } from './create-group-dialog/create-group-dialog';
import { forkJoin } from 'rxjs';
export interface AdminGroup {
  id: string;
  name: string;

  department?: {
    id: string;
    name: string;
  } | null;

  students?: {
    id: string;

    userId: string;

    user: {
      id: string;
      fullName: string;
      email: string;
      status: string;
      avatarUrl?: string | null;
    };
  }[];

  _count?: {
    students: number;
  };
}

@Component({
  selector: 'app-admin-groups',

  standalone: true,

  imports: [CommonModule, MatIconModule, MatDialogModule, MatSnackBarModule],

  templateUrl: './admin-groups.html',
  styleUrl: './admin-groups.scss',
})
export class AdminGroups {
  private readonly adminService = inject(AdminService);

  readonly faculties = signal<any[]>([]);

  readonly departments = signal<any[]>([]);

  private readonly dialog = inject(MatDialog);

  private readonly snackBar = inject(MatSnackBar);

  readonly groups = signal<AdminGroup[]>([]);

  readonly loading = signal(true);

  readonly search = signal('');

  readonly filteredGroups = computed(() => {
    const search = this.search().trim().toLowerCase();

    if (!search) {
      return this.groups();
    }

    return this.groups().filter(
      (group) =>
        group.name.toLowerCase().includes(search) ||
        group.department?.name?.toLowerCase().includes(search),
    );
  });
  activeStudentsCount(group: AdminGroup): number {
    return (group.students ?? []).filter((student) => student.user.status === 'ACTIVE').length;
  }
  readonly totalStudents = computed(() => {
    return this.groups().reduce(
      (total, group) => total + this.studentsCount(group),

      0,
    );
  });

  readonly departmentsCount = computed(() => {
    return new Set(
      this.groups()
        .map((group) => group.department?.id)
        .filter(Boolean),
    ).size;
  });

  readonly largestGroup = computed(() => {
    const groups = [...this.groups()];

    if (!groups.length) {
      return null;
    }

    return groups.sort((a, b) => this.studentsCount(b) - this.studentsCount(a))[0];
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    forkJoin({
      groups: this.adminService.getGroups(),

      faculties: this.adminService.getFaculties(),

      departments: this.adminService.getDepartments(),
    }).subscribe({
      next: ({ groups, faculties, departments }) => {
        this.groups.set(groups as AdminGroup[]);

        this.faculties.set(faculties);

        this.departments.set(departments);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Ошибка загрузки данных:', error);

        this.loading.set(false);

        this.snackBar.open('Не удалось загрузить данные', 'Закрыть', {
          duration: 3500,
        });
      },
    });
  }
  openCreateFaculty(): void {
    const ref = this.dialog.open(CreateFacultyDialog, {
      width: '540px',

      maxWidth: 'calc(100vw - 32px)',

      autoFocus: false,
    });

    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.load();
      }
    });
  }
  openCreateDepartment(): void {
    const ref = this.dialog.open(CreateDepartmentDialog, {
      width: '540px',

      maxWidth: 'calc(100vw - 32px)',

      autoFocus: false,

      data: {
        faculties: this.faculties(),
      },
    });

    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.load();
      }
    });
  }
  openCreateGroup(): void {
    const ref = this.dialog.open(CreateGroupDialog, {
      width: '540px',

      maxWidth: 'calc(100vw - 32px)',

      autoFocus: false,

      data: {
        departments: this.departments(),
      },
    });

    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.load();
      }
    });
  }
  setSearch(value: string): void {
    this.search.set(value);
  }

  studentsCount(group: AdminGroup): number {
    return group._count?.students ?? group.students?.length ?? 0;
  }

  openGroup(group: AdminGroup): void {
    const dialogRef = this.dialog.open(GroupDetailsDialogComponent, {
      width: '860px',

      maxWidth: 'calc(100vw - 32px)',

      maxHeight: '90vh',

      autoFocus: false,

      data: {
        group,
      },
    });

    dialogRef.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
      }
    });
  }
}
