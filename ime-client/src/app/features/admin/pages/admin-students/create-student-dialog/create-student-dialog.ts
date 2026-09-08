import { Component, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatIconModule } from '@angular/material/icon';

import { MatSelectModule } from '@angular/material/select';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { finalize } from 'rxjs';

import { AdminService } from '../../../services/admin.service';

interface DialogData {
  groups: {
    id: string;
    name: string;

    department?: {
      id: string;
      name: string;
    } | null;
  }[];
}

@Component({
  selector: 'app-create-student-dialog',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,

    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
  ],

  templateUrl: './create-student-dialog.html',

  styleUrl: './create-student-dialog.scss',
})
export class CreateStudentDialog {
  private readonly adminService = inject(AdminService);

  private readonly dialogRef = inject(MatDialogRef<CreateStudentDialog>);

  private readonly snackBar = inject(MatSnackBar);

  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  fullName = '';

  email = '';

  phone = '';

  password = '';

  groupId = '';

  readonly loading = signal(false);

  readonly showPassword = signal(false);

  readonly error = signal<string | null>(null);

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  close(): void {
    if (this.loading()) {
      return;
    }

    this.dialogRef.close();
  }

  create(): void {
    if (!this.fullName.trim() || !this.email.trim() || !this.password || !this.groupId) {
      this.error.set('Заполните обязательные поля');

      return;
    }

    if (this.password.length < 6) {
      this.error.set('Пароль должен содержать минимум 6 символов');

      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.adminService
      .createStudent({
        fullName: this.fullName.trim(),

        email: this.email.trim().toLowerCase(),

        password: this.password,

        phone: this.phone.trim() || undefined,

        groupId: this.groupId,
      })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Студент успешно создан', 'OK', {
            duration: 2500,
          });

          this.dialogRef.close(true);
        },

        error: (error) => {
          console.error('Ошибка создания студента:', error);

          this.error.set(error.error?.message ?? 'Не удалось создать студента');
        },
      });
  }
}
