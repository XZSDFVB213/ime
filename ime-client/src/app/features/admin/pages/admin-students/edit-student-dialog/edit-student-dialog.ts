import {
  Component,
  Inject,
  inject,
  signal,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatSelectModule,
} from '@angular/material/select';

import {
  finalize,
} from 'rxjs';

import {
  AdminService,
} from '../../../services/admin.service';


interface Group {
  id: string;
  name: string;
}


@Component({
  selector:
    'app-edit-student-dialog',

  standalone: true,

  imports: [
    FormsModule,
    MatIconModule,
    MatSelectModule,
  ],

  templateUrl:
    './edit-student-dialog.html',

  styleUrl:
    './edit-student-dialog.scss',
})
export class EditStudentDialog {
  private readonly adminService =
    inject(AdminService);

  private readonly dialogRef =
    inject(
      MatDialogRef<EditStudentDialog>,
    );


  fullName = '';
  email = '';
  phone = '';
  groupId = '';

  password = '';
  hidePassword = true;


  readonly saving =
    signal(false);

  readonly error =
    signal<string | null>(null);


  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      studentId: string;

      fullName: string;
      email: string;

      phone?: string | null;

      groupId?: string | null;

      groups: Group[];
    },
  ) {
    this.fullName =
      data.fullName;

    this.email =
      data.email;

    this.phone =
      data.phone ?? '';

    this.groupId =
      data.groupId ?? '';
  }


  save(): void {
    if (
      !this.fullName.trim() ||
      !this.email.trim() ||
      !this.groupId
    ) {
      this.error.set(
        'Заполните обязательные поля',
      );

      return;
    }


    if (
      this.password &&
      this.password.length < 6
    ) {
      this.error.set(
        'Новый пароль должен содержать минимум 6 символов',
      );

      return;
    }


    const dto: {
      fullName: string;
      email: string;
      phone?: string;
      groupId: string;
      password?: string;
    } = {
      fullName:
        this.fullName.trim(),

      email:
        this.email.trim(),

      phone:
        this.phone.trim(),

      groupId:
        this.groupId,
    };


    /*
     * Пустой password вообще
     * не отправляем.
     */
    if (this.password) {
      dto.password =
        this.password;
    }


    this.saving.set(true);
    this.error.set(null);


    this.adminService
      .updateStudent(
        this.data.studentId,
        dto,
      )
      .pipe(
        finalize(() => {
          this.saving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(
            true,
          );
        },

        error: (error) => {
          this.error.set(
            error.error?.message ??
              'Не удалось сохранить студента',
          );
        },
      });
  }


  close(): void {
    this.dialogRef.close();
  }
}