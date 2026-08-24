import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';

import {
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';

import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';

import {
  TeacherService,
} from '../../services/teacher.service';

type SubmissionTab =
  | 'ALL'
  | 'PENDING'
  | 'GRADED'
  | 'MISSING';

@Component({
  selector: 'app-homework-details',
  standalone: true,

  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,

    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],

  templateUrl: './homework-details.html',
  styleUrl: './homework-details.scss',
})
export class HomeworkDetails {
  private readonly route =
    inject(ActivatedRoute);

  private readonly teacherService =
    inject(TeacherService);

  private readonly snackBar =
    inject(MatSnackBar);

  readonly homework = signal<any | null>(null);

  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly error =
    signal<string | null>(null);

  readonly activeTab =
    signal<SubmissionTab>('ALL');

  readonly selectedSubmission =
    signal<any | null>(null);

  readonly scoreControl =
    new FormControl<number | null>(
      null,
      {
        validators: [
          Validators.required,
          Validators.min(0),
        ],
      },
    );

  readonly feedbackControl =
    new FormControl('', {
      nonNullable: true,
    });

  readonly submissions = computed(() => {
    return this.homework()?.submissions ?? [];
  });

  readonly pendingSubmissions = computed(() => {
    return this.submissions().filter(
      (submission: any) =>
        submission.status === 'SUBMITTED',
    );
  });

  readonly gradedSubmissions = computed(() => {
    return this.submissions().filter(
      (submission: any) =>
        submission.status === 'GRADED',
    );
  });

  readonly students = computed(() => {
    return (
      this.homework()
        ?.lesson
        ?.group
        ?.students ?? []
    );
  });

  readonly missingStudents = computed(() => {
    const submittedStudentIds =
      new Set(
        this.submissions().map(
          (submission: any) =>
            submission.studentId,
        ),
      );

    return this.students().filter(
      (student: any) =>
        !submittedStudentIds.has(student.id),
    );
  });

  readonly filteredSubmissions =
    computed(() => {
      switch (this.activeTab()) {
        case 'PENDING':
          return this.pendingSubmissions();

        case 'GRADED':
          return this.gradedSubmissions();

        default:
          return this.submissions();
      }
    });

  readonly submissionPercent = computed(() => {
    const total = this.students().length;

    if (!total) {
      return 0;
    }

    return Math.round(
      (this.submissions().length / total) *
        100,
    );
  });

  readonly averageScore = computed(() => {
    const graded =
      this.gradedSubmissions().filter(
        (submission: any) =>
          typeof submission.score ===
          'number',
      );

    if (!graded.length) {
      return 0;
    }

    return Math.round(
      graded.reduce(
        (sum: number, submission: any) =>
          sum + submission.score,
        0,
      ) / graded.length,
    );
  });

  constructor() {
    this.loadHomework();
  }

  setTab(tab: SubmissionTab): void {
    this.activeTab.set(tab);

    if (tab === 'MISSING') {
      this.selectedSubmission.set(null);
      return;
    }

    const first =
      tab === 'PENDING'
        ? this.pendingSubmissions()[0]
        : tab === 'GRADED'
          ? this.gradedSubmissions()[0]
          : this.submissions()[0];

    if (first) {
      this.selectSubmission(first);
    } else {
      this.selectedSubmission.set(null);
    }
  }

  selectSubmission(
    submission: any,
  ): void {
    this.selectedSubmission.set(submission);

    this.scoreControl.setValue(
      submission.score ?? null,
    );

    this.feedbackControl.setValue(
      submission.feedback ?? '',
    );
  }

  gradeSubmission(): void {
    const submission =
      this.selectedSubmission();

    const homework = this.homework();

    if (!submission || !homework) {
      return;
    }

    const score =
      this.scoreControl.value;

    if (score === null) {
      this.scoreControl.markAsTouched();
      return;
    }

    if (score < 0) {
      this.snackBar.open(
        'Оценка не может быть отрицательной',
        'Закрыть',
        {
          duration: 3000,
        },
      );

      return;
    }

    if (score > homework.maxScore) {
      this.snackBar.open(
        `Максимальная оценка — ${homework.maxScore}`,
        'Закрыть',
        {
          duration: 3500,
        },
      );

      return;
    }

    this.saving.set(true);

    this.teacherService
      .gradeSubmission(
        submission.id,
        {
          score,
          feedback:
            this.feedbackControl.value.trim(),
        },
      )
      .subscribe({
        next: () => {
          this.saving.set(false);

          this.snackBar.open(
            'Оценка сохранена',
            'Закрыть',
            {
              duration: 2500,
            },
          );

          this.loadHomework(
            submission.id,
          );
        },

        error: (error) => {
          console.error(error);

          this.saving.set(false);

          this.snackBar.open(
            error.error?.message ??
              'Не удалось сохранить оценку',
            'Закрыть',
            {
              duration: 4000,
            },
          );
        },
      });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'SUBMITTED':
        return 'На проверке';

      case 'GRADED':
        return 'Проверено';

      case 'DRAFT':
        return 'Черновик';

      default:
        return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'SUBMITTED':
        return 'pending';

      case 'GRADED':
        return 'graded';

      case 'DRAFT':
        return 'draft';

      default:
        return 'default';
    }
  }

  studentInitials(
    student: any,
  ): string {
    const fullName =
      student?.user?.fullName ?? '';

    return fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part: string) =>
          part[0]?.toUpperCase(),
      )
      .join('');
  }

  private loadHomework(
    selectedId?: string,
  ): void {
    const id =
      this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set(
        'Не указан ID задания',
      );

      this.loading.set(false);

      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.teacherService
      .getHomework(id)
      .subscribe({
        next: (homework) => {
          this.homework.set(homework);

          this.loading.set(false);

          let submission = null;

          if (selectedId) {
            submission =
              homework.submissions?.find(
                (item: any) =>
                  item.id === selectedId,
              );
          }

          submission ??=
            homework.submissions?.find(
              (item: any) =>
                item.status ===
                'SUBMITTED',
            );

          submission ??=
            homework.submissions?.[0];

          if (submission) {
            this.selectSubmission(
              submission,
            );
          } else {
            this.selectedSubmission.set(
              null,
            );
          }
        },

        error: (error) => {
          console.error(error);

          this.loading.set(false);

          this.error.set(
            error.error?.message ??
              'Не удалось загрузить задание',
          );
        },
      });
  }
}