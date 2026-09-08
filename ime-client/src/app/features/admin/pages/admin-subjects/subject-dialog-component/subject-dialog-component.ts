import { Component, Inject, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatSelectModule } from '@angular/material/select';

import { MatIconModule } from '@angular/material/icon';

import { finalize } from 'rxjs';

import { AdminService } from '../../../services/admin.service';

import { AdminSubject } from '../admin-subjects';

@Component({
  selector: 'app-subject-dialog',

  standalone: true,

  imports: [FormsModule, MatDialogModule, MatSelectModule, MatIconModule],

  templateUrl: './subject-dialog-component.html',

  styleUrl: './subject-dialog-component.scss',
})
export class SubjectDialogComponent {
  private readonly adminService = inject(AdminService);

  private readonly dialogRef = inject(MatDialogRef<SubjectDialogComponent>);

  name = '';
  code = '';
  description = '';

  credits = 0;

  departmentId = '';

  readonly saving = signal(false);

  readonly error = signal<string | null>(null);

  readonly editing: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      subject: AdminSubject | null;

      departments: {
        id: string;
        name: string;
      }[];
    },
  ) {
    this.editing = !!data.subject;

    if (data.subject) {
      this.name = data.subject.name;

      this.code = data.subject.code;

      this.description = data.subject.description ?? '';

      this.credits = data.subject.credits;

      this.departmentId = data.subject.departmentId;
    }
  }

  save(): void {
    if (!this.name.trim() || !this.code.trim() || !this.departmentId || this.credits < 0) {
      this.error.set('Заполните обязательные поля');

      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const dto = {
      name: this.name.trim(),

      code: this.code.trim(),

      description: this.description.trim(),

      credits: Number(this.credits),

      departmentId: this.departmentId,
    };

    const request = this.data.subject
      ? this.adminService.updateSubject(this.data.subject.id, dto)
      : this.adminService.createSubject(dto);

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
          this.error.set(error.error?.message ?? 'Не удалось сохранить дисциплину');
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
