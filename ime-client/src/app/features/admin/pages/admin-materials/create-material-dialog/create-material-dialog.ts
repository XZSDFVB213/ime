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
  MatDialogModule,
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


@Component({
  selector:
    'app-create-material-dialog',

  standalone: true,

  imports: [
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
  ],

  templateUrl:
    './create-material-dialog.html',

  styleUrl:
    './create-material-dialog.scss',
})
export class CreateMaterialDialogComponent {
  private readonly adminService =
    inject(AdminService);

  private readonly dialogRef =
    inject(
      MatDialogRef<CreateMaterialDialogComponent>,
    );


  type:
    | 'FILE'
    | 'LINK' =
    'FILE';

  title = '';
  description = '';
  subjectId = '';
  url = '';

  file:
    File |
    null =
    null;


  readonly saving =
    signal(false);

  readonly error =
    signal<string | null>(null);


  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      subjects: {
        id: string;
        name: string;
      }[];
    },
  ) {}


  selectFile(
    event: Event,
  ): void {
    const input =
      event.target as
        HTMLInputElement;

    this.file =
      input.files?.[0] ??
      null;
  }


  save(): void {
    if (
      !this.title.trim() ||
      !this.subjectId
    ) {
      this.error.set(
        'Заполните обязательные поля',
      );

      return;
    }

    if (
      this.type === 'FILE' &&
      !this.file
    ) {
      this.error.set(
        'Выберите файл',
      );

      return;
    }

    if (
      this.type === 'LINK' &&
      !this.url.trim()
    ) {
      this.error.set(
        'Укажите ссылку',
      );

      return;
    }


    this.saving.set(true);
    this.error.set(null);


    const request =
      this.type === 'FILE'
        ? this.adminService
            .createFileMaterial({
              title:
                this.title.trim(),

              description:
                this.description.trim(),

              subjectId:
                this.subjectId,

              file:
                this.file!,
            })

        : this.adminService
            .createLinkMaterial({
              title:
                this.title.trim(),

              description:
                this.description.trim(),

              subjectId:
                this.subjectId,

              url:
                this.url.trim(),
            });


    request
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
              'Не удалось создать материал',
          );
        },
      });
  }


  close(): void {
    this.dialogRef.close();
  }
}