import { Component, computed, inject, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { MatSelectModule } from '@angular/material/select';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';

import { AdminService } from '../../services/admin.service';

import { SubjectDialogComponent } from './subject-dialog-component/subject-dialog-component';

export interface AdminSubject {
  id: string;

  name: string;
  code: string;

  description?: string | null;

  credits: number;

  departmentId: string;

  department: {
    id: string;
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

@Component({
  selector: 'app-admin-subjects',

  standalone: true,

  imports: [MatIconModule, MatSelectModule, MatDialogModule, MatSnackBarModule],

  templateUrl: './admin-subjects.html',

  styleUrl: './admin-subjects.scss',
})
export class AdminSubjects {
  private readonly adminService = inject(AdminService);

  private readonly dialog = inject(MatDialog);

  private readonly snackBar = inject(MatSnackBar);

  readonly subjects = signal<AdminSubject[]>([]);

  readonly departments = signal<Department[]>([]);

  readonly loading = signal(true);

  readonly search = signal('');

  readonly departmentFilter = signal('ALL');

  readonly filteredSubjects = computed(() => {
    const search = this.search().trim().toLowerCase();

    const department = this.departmentFilter();

    return this.subjects().filter((subject) => {
      if (department !== 'ALL' && subject.departmentId !== department) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        subject.name.toLowerCase().includes(search) ||
        subject.code.toLowerCase().includes(search) ||
        subject.department.name.toLowerCase().includes(search)
      );
    });
  });

  readonly totalCredits = computed(() => {
    return this.subjects().reduce(
      (total, subject) => total + subject.credits,

      0,
    );
  });

  readonly departmentsCount = computed(() => {
    return new Set(this.subjects().map((subject) => subject.departmentId)).size;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    forkJoin({
      subjects: this.adminService.getSubjects(),

      departments: this.adminService.getDepartments(),
    }).subscribe({
      next: ({ subjects, departments }) => {
        this.subjects.set(subjects as AdminSubject[]);

        this.departments.set(departments as Department[]);

        this.loading.set(false);
      },

      error: (error) => {
        console.error(error);

        this.loading.set(false);

        this.snackBar.open('Не удалось загрузить дисциплины', 'Закрыть', {
          duration: 3000,
        });
      },
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(SubjectDialogComponent, {
      width: '580px',

      maxWidth: 'calc(100vw - 32px)',

      autoFocus: false,

      data: {
        subject: null,

        departments: this.departments(),
      },
    });

    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
      }
    });
  }

  openEdit(subject: AdminSubject): void {
    const ref = this.dialog.open(SubjectDialogComponent, {
      width: '580px',

      maxWidth: 'calc(100vw - 32px)',

      autoFocus: false,

      data: {
        subject,

        departments: this.departments(),
      },
    });

    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
      }
    });
  }
}
