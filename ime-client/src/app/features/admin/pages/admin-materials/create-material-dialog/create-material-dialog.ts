import { Component, Inject, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatIconModule } from '@angular/material/icon';

import { MatSelectModule } from '@angular/material/select';

import { finalize } from 'rxjs';

import { AdminService } from '../../../services/admin.service';

interface MaterialSubject {
  id: string;
  name: string;
}

@Component({
  selector: 'app-create-material-dialog',

  standalone: true,

  imports: [FormsModule, MatDialogModule, MatIconModule, MatSelectModule],

  templateUrl: './create-material-dialog.html',

  styleUrl: './create-material-dialog.scss',
})
export class CreateMaterialDialogComponent {
  private readonly adminService = inject(AdminService);

  private readonly dialogRef = inject(MatDialogRef<CreateMaterialDialogComponent>);

  type: 'FILE' | 'LINK' = 'FILE';

  title = '';

  description = '';

  /*
   * Пустая строка =
   * общий материал без дисциплины.
   */
  subjectId = '';

  url = '';

  file: File | null = null;

  readonly saving = signal(false);

  readonly error = signal<string | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      subjects: MaterialSubject[];
    },
  ) {}

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.file = input.files?.[0] ?? null;
  }

  setType(type: 'FILE' | 'LINK'): void {
    this.type = type;

    this.error.set(null);

    if (type === 'FILE') {
      this.url = '';
    } else {
      this.file = null;
    }
  }

  save(): void {
    /*
     * Дисциплина больше
     * НЕ обязательна.
     */
    if (!this.title.trim()) {
      this.error.set('Укажите название материала');

      return;
    }

    if (this.type === 'FILE' && !this.file) {
      this.error.set('Выберите файл');

      return;
    }

    if (this.type === 'LINK' && !this.url.trim()) {
      this.error.set('Укажите ссылку');

      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const description = this.description.trim() || undefined;

    const subjectId = this.subjectId || undefined;

    const request =
      this.type === 'FILE'
        ? this.adminService.createFileMaterial({
            title: this.title.trim(),

            description,

            subjectId,

            file: this.file!,
          })
        : this.adminService.createLinkMaterial({
            title: this.title.trim(),

            description,

            subjectId,

            url: this.url.trim(),
          });

    request
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
          console.error('Ошибка создания материала', error);

          this.error.set(error.error?.message ?? 'Не удалось создать материал');
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
