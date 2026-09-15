import { Component, Inject, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MatIconModule } from '@angular/material/icon';

import { MatSelectModule } from '@angular/material/select';

import { finalize } from 'rxjs';

import { AdminService } from '../../../services/admin.service';

interface Department {
  id: string;
  name: string;
}

@Component({
  selector: 'app-edit-teacher-dialog',

  standalone: true,

  imports: [FormsModule, MatIconModule, MatSelectModule],

  templateUrl: './edit-teacher-dialog.html',

  styleUrl: './edit-teacher-dialog.scss',
})
export class EditTeacherDialog {
  private readonly adminService = inject(AdminService);

  private readonly dialogRef = inject(MatDialogRef<EditTeacherDialog>);

  fullName = '';
  email = '';
  phone = '';
  position = '';
  departmentIds: string[] = [];
  password = '';

  hidePassword = true;

  readonly saving = signal(false);

  readonly error = signal<string | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      teacherId: string;

      fullName: string;
      email: string;

      phone?: string | null;

      position?: string | null;

      departmentIds: string[];

      departments: Department[];
    },
  ) {
    this.fullName = data.fullName;

    this.email = data.email;

    this.phone = data.phone ?? '';

    this.position = data.position ?? '';

    this.departmentIds = [...data.departmentIds];
  }

  save(): void {
    if (!this.fullName.trim() || !this.email.trim()) {
      this.error.set('Заполните обязательные поля');

      return;
    }

    if (this.password && this.password.length < 6) {
      this.error.set('Новый пароль должен содержать минимум 6 символов');

      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const dto: {
      fullName: string;
      email: string;
      phone?: string;
      position?: string;
      departmentIds: string[];
      password?: string;
    } = {
      fullName: this.fullName.trim(),

      email: this.email.trim(),

      phone: this.phone.trim(),

      position: this.position.trim(),

      departmentIds: this.departmentIds,
    };

    if (this.password) {
      dto.password = this.password;
    }

    this.adminService
      .updateTeacher(this.data.teacherId, dto)
      .pipe(
        finalize(() => {
          this.saving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
        },

        error: (error) => {
          this.error.set(error.error?.message ?? 'Не удалось сохранить преподавателя');
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
  getDepartment(
  departmentId: string,
): Department | undefined {
  return this.data.departments
    .find(
      (department) =>
        department.id ===
        departmentId,
    );
}
}
