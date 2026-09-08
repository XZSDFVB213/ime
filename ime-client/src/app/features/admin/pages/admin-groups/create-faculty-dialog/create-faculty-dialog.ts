import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatDialogRef } from '@angular/material/dialog';

import { MatIconModule } from '@angular/material/icon';

import { finalize } from 'rxjs';

import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-create-faculty-dialog',

  standalone: true,

  imports: [FormsModule, MatIconModule],

  templateUrl: './create-faculty-dialog.html',

  styleUrl: './create-faculty-dialog.scss',
})
export class CreateFacultyDialog {
  private readonly adminService = inject(AdminService);

  private readonly dialogRef = inject(MatDialogRef<CreateFacultyDialog>);

  name = '';
  shortName = '';

  readonly saving = signal(false);

  readonly error = signal<string | null>(null);

  save(): void {
    const name = this.name.trim();

    const shortName = this.shortName.trim();

    if (!name || !shortName) {
      this.error.set('Введите название и сокращение');

      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.adminService
      .createFaculty({
        name,
        shortName,
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
          this.error.set(error.error?.message ?? 'Не удалось создать факультет');
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
