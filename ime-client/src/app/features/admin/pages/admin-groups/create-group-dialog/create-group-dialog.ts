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


interface Department {
  id: string;
  name: string;

  faculty?: {
    id: string;
    name: string;
    shortName: string;
  };
}


@Component({
  selector:
    'app-create-group-dialog',

  standalone: true,

  imports: [
    FormsModule,
    MatIconModule,
    MatSelectModule,
  ],

  templateUrl:
    './create-group-dialog.html',

  styleUrl:
    './create-group-dialog.scss',
})
export class CreateGroupDialog {
  private readonly adminService =
    inject(AdminService);

  private readonly dialogRef =
    inject(
      MatDialogRef<CreateGroupDialog>,
    );


  name = '';
  departmentId = '';


  readonly saving =
    signal(false);

  readonly error =
    signal<string | null>(null);


  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      departments: Department[];
    },
  ) {}


  save(): void {
    const name =
      this.name.trim();


    if (
      !name ||
      !this.departmentId
    ) {
      this.error.set(
        'Введите название группы и выберите кафедру',
      );

      return;
    }


    this.saving.set(true);
    this.error.set(null);


    this.adminService
      .createGroup({
        name,

        departmentId:
          this.departmentId,
      })
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
          this.error.set(
            error.error?.message ??
              'Не удалось создать группу',
          );
        },
      });
  }


  close(): void {
    this.dialogRef.close();
  }
}