import { Component, Inject, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MatIconModule } from '@angular/material/icon';

import { MatSelectModule } from '@angular/material/select';

import { finalize } from 'rxjs';

import { AdminService } from '../../../services/admin.service';

interface Faculty {
  id: string;
  name: string;
  shortName: string;
}

@Component({
  selector: 'app-create-department-dialog',

  standalone: true,

  imports: [FormsModule, MatIconModule, MatSelectModule],

  templateUrl: './create-departament-dialog.html',

  styleUrl: './create-departament-dialog.scss',
})
export class CreateDepartmentDialog {
  private readonly adminService = inject(AdminService);

  private readonly dialogRef = inject(MatDialogRef<CreateDepartmentDialog>);

  name = '';
  facultyId = '';

  readonly saving = signal(false);

  readonly error = signal<string | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      faculties: Faculty[];
    },
  ) {}

  save(): void {
    const name = this.name.trim();

    if (!name || !this.facultyId) {
      this.error.set('Введите название кафедры и выберите факультет');

      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.adminService
      .createDepartment({
        name,

        facultyId: this.facultyId,
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
          this.error.set(error.error?.message ?? 'Не удалось создать кафедру');
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
