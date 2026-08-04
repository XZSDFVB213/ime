import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface GradeDialogData {
  submissionId: number | string;
  studentName: string;
  studentEmail: string;
  maxScore: number;
  currentScore: number | null;
  currentComment?: string | null;
}

export interface GradeDialogResult {
  score: number;
  comment: string;
}

@Component({
  standalone: true,
  selector: 'app-grade-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './grade-dialog.html',
  styleUrl: './grade-dialog.scss',
})
export class GradeDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<GradeDialog, GradeDialogResult>);
  readonly data = inject<GradeDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    score: [
      this.data.currentScore ?? 0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(this.data.maxScore),
      ],
    ],
    comment: [this.data.currentComment ?? ''],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { score, comment } = this.form.getRawValue();
    this.dialogRef.close({ score, comment });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}