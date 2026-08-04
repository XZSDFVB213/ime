import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

export interface CreateHomeworkDialogData {
  lessonId: string;
  subjectId: string;
  teacherId: string; // если бэк требует
}

export interface CreateHomeworkResult {
  lessonId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  maxScore: number;
  deadline: string; // ISO
}

@Component({
  standalone: true,
  selector: 'app-create-homework-dialog',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
  ],
  templateUrl: './create-homework-dialog.html',
  styleUrl: './create-homework-dialog.scss',
})
export class CreateHomeworkDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateHomeworkDialog, CreateHomeworkResult>);
  readonly data = inject<CreateHomeworkDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    maxScore: [100, [Validators.required, Validators.min(1), Validators.max(1000)]],
    deadline: [null as Date | null, Validators.required],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.dialogRef.close({
      lessonId: this.data.lessonId,
      subjectId: this.data.subjectId,
      teacherId: this.data.teacherId,
      title: value.title.trim(),
      description: value.description.trim(),
      maxScore: value.maxScore,
      deadline: value.deadline!.toISOString(),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
