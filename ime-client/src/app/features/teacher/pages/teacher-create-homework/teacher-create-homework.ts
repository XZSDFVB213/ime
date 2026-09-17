import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import { DatePipe } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';

import { TeacherService } from '../../services/teacher.service';


@Component({
  selector: 'app-create-homework',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],

  templateUrl: './teacher-create-homework.html',
  styleUrl: './teacher-create-homework.scss',
})
export class TeacherCreateHomework {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly teacherService =
    inject(TeacherService);

  private readonly snackBar =
    inject(MatSnackBar);


  readonly lessons =
    signal<any[]>([]);

  readonly loading =
    signal(true);

  readonly submitting =
    signal(false);

  readonly error =
    signal<string | null>(null);


  readonly form = new FormGroup({
  lessonId: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
    ],
  }),

  title: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(150),
    ],
  }),

  description: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(5),
    ],
  }),

  deadline: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
    ],
  }),

  maxScore: new FormControl(100, {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.min(1),
      Validators.max(1000),
    ],
  }),
});
selectedLesson(): any | null {
  const lessonId =
    this.form.controls.lessonId.value;

  if (!lessonId) {
    return null;
  }

  return (
    this.lessons().find(
      (lesson) =>
        lesson.id === lessonId,
    ) ?? null
  );
}


  constructor() {
    this.loadLessons();
  }


  lessonEndTime(
    lesson: any,
  ): Date {
    const start =
      new Date(lesson.date);

    return new Date(
      start.getTime() +
        Number(
          lesson.duration ?? 90,
        ) *
          60_000,
    );
  }


  lessonType(
    type: string,
  ): string {
    switch (type) {
      case 'LECTURE':
        return 'Лекция';

      case 'PRACTICE':
        return 'Практическое занятие';

      case 'SEMINAR':
        return 'Семинар';

      case 'LAB':
        return 'Лабораторная работа';

      default:
        return 'Занятие';
    }
  }


  submit(): void {
    if (
      this.form.invalid ||
      this.submitting()
    ) {
      this.form.markAllAsTouched();

      return;
    }


    const {
      lessonId,
      title,
      description,
      deadline,
      maxScore,
    } = this.form.getRawValue();


    const lesson =
      this.lessons().find(
        (item) =>
          item.id === lessonId,
      );


    if (!lesson) {
      this.snackBar.open(
        'Выберите занятие',
        'Закрыть',
        {
          duration: 3000,
        },
      );

      return;
    }


    const deadlineDate =
      new Date(deadline);


    if (
      Number.isNaN(
        deadlineDate.getTime(),
      )
    ) {
      this.snackBar.open(
        'Укажите корректный срок сдачи',
        'Закрыть',
        {
          duration: 3000,
        },
      );

      return;
    }


    if (
      deadlineDate.getTime() <=
      Date.now()
    ) {
      this.snackBar.open(
        'Срок сдачи должен быть в будущем',
        'Закрыть',
        {
          duration: 3500,
        },
      );

      return;
    }


    this.submitting.set(true);


    this.teacherService
      .createHomework({
        lessonId:
          lesson.id,

        subjectId:
          lesson.subject.id,

        title:
          title.trim(),

        description:
          description.trim(),

        deadline:
          deadlineDate.toISOString(),

        maxScore,
      })
      .subscribe({
        next: (homework) => {
          this.submitting.set(
            false,
          );

          this.snackBar.open(
            'Домашнее задание создано',
            'Закрыть',
            {
              duration: 2500,
            },
          );

          this.router.navigate([
            '/teacher/homeworks',
            homework.id,
          ]);
        },

        error: (error) => {
          console.error(
            'Ошибка создания задания',
            error,
          );

          this.submitting.set(
            false,
          );

          this.snackBar.open(
            error.error?.message ??
              'Не удалось создать домашнее задание',
            'Закрыть',
            {
              duration: 4000,
            },
          );
        },
      });
  }


  private loadLessons(): void {
    this.loading.set(true);
    this.error.set(null);


    this.teacherService
      .getLessons()
      .subscribe({
        next: (lessons) => {
          this.lessons.set(
            lessons ?? [],
          );


          /*
           * Если пришли со страницы
           * конкретного занятия,
           * выбираем его автоматически.
           */
          const lessonId =
            this.route.snapshot
              .paramMap
              .get('lessonId');


          if (
            lessonId &&
            lessons.some(
              (lesson) =>
                lesson.id ===
                lessonId,
            )
          ) {
            this.form.controls
              .lessonId
              .setValue(
                lessonId,
              );
          }


          this.loading.set(false);
        },

        error: (error) => {
          console.error(
            error,
          );

          this.error.set(
            error.error?.message ??
              'Не удалось загрузить занятия',
          );

          this.loading.set(false);
        },
      });
  }
}