import {
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import {
  finalize,
} from 'rxjs';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';

import {
  MatSnackBar,
} from '@angular/material/snack-bar';

import {
  TeacherService,
} from '../../services/teacher.service';


type AssessmentResult =
  | 'EXCELLENT'
  | 'GOOD'
  | 'SATISFACTORY'
  | 'UNSATISFACTORY'
  | 'PASSED'
  | 'NOT_PASSED';


@Component({
  selector:
    'app-teacher-lesson-assessments',

  standalone: true,

  imports: [
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
  ],

  templateUrl:
    './teacher-lesson-assessments.html',

  styleUrl:
    './teacher-lesson-assessments.scss',
})
export class TeacherLessonAssessments {
  private readonly route =
    inject(ActivatedRoute);

  private readonly teacherService =
    inject(TeacherService);

  private readonly snackBar =
    inject(MatSnackBar);


  readonly lessonId =
    this.route.snapshot
      .paramMap
      .get('lessonId') ?? '';


  readonly lesson =
    signal<any | null>(null);

  readonly loading =
    signal(true);

  readonly saving =
    signal(false);

  readonly error =
    signal<string | null>(null);


  readonly results =
    signal<
      Record<
        string,
        AssessmentResult | ''
      >
    >({});


  constructor() {
    this.load();
  }


  resultOptions(): {
    value: AssessmentResult;
    label: string;
  }[] {
    if (
      this.lesson()?.type ===
      'CREDIT'
    ) {
      return [
        {
          value: 'PASSED',
          label: 'Зачтено',
        },
        {
          value: 'NOT_PASSED',
          label: 'Не зачтено',
        },
      ];
    }


    return [
      {
        value: 'EXCELLENT',
        label: '5 — Отлично',
      },
      {
        value: 'GOOD',
        label: '4 — Хорошо',
      },
      {
        value: 'SATISFACTORY',
        label:
          '3 — Удовлетворительно',
      },
      {
        value:
          'UNSATISFACTORY',
        label:
          '2 — Неудовлетворительно',
      },
    ];
  }


 setResult(
  studentId: string,
  event: Event,
): void {
  const select =
    event.target as HTMLSelectElement;

  const value =
    select.value as
      | AssessmentResult
      | '';

  this.results.update(
    (results) => ({
      ...results,
      [studentId]: value,
    }),
  );
}


  save(): void {
    if (
      !this.lesson() ||
      this.saving()
    ) {
      return;
    }


    const assessments =
      Object.entries(
        this.results(),
      )
        .filter(
          (
            [, result],
          ) =>
            Boolean(result),
        )
        .map(
          ([
            studentId,
            result,
          ]) => ({
            studentId,

            result:
              result as
                AssessmentResult,
          }),
        );


    if (!assessments.length) {
      this.snackBar.open(
        'Выставьте хотя бы один результат',
        'Закрыть',
        {
          duration: 3000,
        },
      );

      return;
    }


    this.saving.set(true);


    this.teacherService
      .saveLessonAssessments(
        this.lessonId,
        assessments,
      )
      .pipe(
        finalize(() => {
          this.saving.set(
            false,
          );
        }),
      )
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Результаты сохранены',
            'Закрыть',
            {
              duration: 2500,
            },
          );


          this.load();
        },

        error: (error) => {
          console.error(
            error,
          );

          this.snackBar.open(
            error.error?.message ??
              'Не удалось сохранить результаты',
            'Закрыть',
            {
              duration: 4000,
            },
          );
        },
      });
  }


  private load(): void {
    this.loading.set(true);
    this.error.set(null);


    this.teacherService
      .getLessonAssessments(
        this.lessonId,
      )
      .pipe(
        finalize(() => {
          this.loading.set(
            false,
          );
        }),
      )
      .subscribe({
        next: (lesson) => {
          this.lesson.set(
            lesson,
          );


          const results:
            Record<
              string,
              AssessmentResult | ''
            > = {};


          for (
            const student of
              lesson.group
                ?.students ?? []
          ) {
            const assessment =
              lesson.assessments
                ?.find(
                  (
                    item: any,
                  ) =>
                    item.studentId ===
                    student.id,
                );


            results[
              student.id
            ] =
              assessment?.result ??
              '';
          }


          this.results.set(
            results,
          );
        },

        error: (error) => {
          console.error(
            error,
          );

          this.error.set(
            error.error?.message ??
              'Не удалось загрузить ведомость',
          );
        },
      });
  }
}