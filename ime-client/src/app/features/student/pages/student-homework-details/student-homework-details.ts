import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { StudentService } from '../../student.service';

@Component({
  selector: 'app-student-homework-details',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatIcon,
    MatProgressSpinnerModule,
  ],
  templateUrl: './student-homework-details.html',
  styleUrl: './student-homework-details.scss',
})
export class StudentHomeworkDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(StudentService);
  private readonly snackBar = inject(MatSnackBar);

  readonly homework = signal<any | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly answerControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5)],
  });

  readonly submission = computed(() => {
    return this.homework()?.submissions?.[0] ?? null;
  });

  readonly isSubmitted = computed(() => {
    return this.submission()?.status === 'SUBMITTED';
  });

  readonly isGraded = computed(() => {
    return this.submission()?.status === 'GRADED';
  });

  readonly isLocked = computed(() => {
    return this.isSubmitted() || this.isGraded();
  });

  ngOnInit(): void {
    this.loadHomework();
  }

  submit(): void {
    if (this.answerControl.invalid || this.isLocked()) {
      this.answerControl.markAsTouched();
      return;
    }

    const homeworkId = this.route.snapshot.paramMap.get('id');

    if (!homeworkId) {
      return;
    }

    this.submitting.set(true);

    this.service.submitHomework(homeworkId, this.answerControl.value.trim()).subscribe({
      next: () => {
        this.snackBar.open('Работа отправлена преподавателю', 'Закрыть', {
          duration: 3500,
        });

        this.loadHomework();
      },

      error: (error) => {
        console.error(error);

        this.submitting.set(false);

        this.snackBar.open(error.error?.message ?? 'Не удалось отправить работу', 'Закрыть', {
          duration: 4000,
        });
      },
    });
  }

  private loadHomework(): void {
    const homeworkId = this.route.snapshot.paramMap.get('id');

    if (!homeworkId) {
      this.error.set('Не указан идентификатор задания');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.service.getHomework(homeworkId).subscribe({
      next: (homework) => {
        this.homework.set(homework);

        const submission = homework.submissions?.[0];

        if (submission?.content) {
          this.answerControl.setValue(submission.content);
        }

        this.loading.set(false);
        this.submitting.set(false);
      },

      error: (error) => {
        console.error(error);

        this.error.set(error.error?.message ?? 'Не удалось загрузить задание');

        this.loading.set(false);
        this.submitting.set(false);
      },
    });
  }
}
