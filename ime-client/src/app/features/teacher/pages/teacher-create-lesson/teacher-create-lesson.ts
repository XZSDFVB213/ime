import { Component, computed, inject, signal } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { forkJoin, finalize } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TeacherService, TeacherSubject, TeacherSemester } from '../../services/teacher.service';

@Component({
  selector: 'app-teacher-create-lesson',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],

  templateUrl: './teacher-create-lesson.html',

  styleUrl: './teacher-create-lesson.scss',
})
export class TeacherCreateLesson {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly teacherService = inject(TeacherService);

  private readonly snackBar = inject(MatSnackBar);

  readonly subjectId = this.route.snapshot.paramMap.get('subjectId') ?? '';

  readonly subjects = signal<TeacherSubject[]>([]);

  readonly semesters = signal<TeacherSemester[]>([]);

  readonly loading = signal(true);

  readonly submitting = signal(false);

  readonly error = signal<string | null>(null);

  readonly subject = computed(() => {
    return this.subjects().find((subject) => subject.id === this.subjectId) ?? null;
  });

  readonly form = new FormGroup({
    groupId: new FormControl('', {
      nonNullable: true,

      validators: [Validators.required],
    }),

    semesterId: new FormControl('', {
      nonNullable: true,

      validators: [Validators.required],
    }),

    type: new FormControl<
      'LECTURE' | 'PRACTICE' | 'SEMINAR' | 'LAB' | 'CONSULTATION' | 'CREDIT' | 'EXAM'
    >('LECTURE', {
      nonNullable: true,

      validators: [Validators.required],
    }),

    title: new FormControl('', {
      nonNullable: true,

      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(150)],
    }),

    description: new FormControl('', {
      nonNullable: true,
    }),

    date: new FormControl('', {
      nonNullable: true,

      validators: [Validators.required],
    }),

    duration: new FormControl(90, {
      nonNullable: true,

      validators: [Validators.required, Validators.min(15)],
    }),

    location: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor() {
    this.loadData();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();

      return;
    }

    const subject = this.subject();

    if (!subject) {
      return;
    }

    const value = this.form.getRawValue();

    const date = new Date(value.date);

    if (Number.isNaN(date.getTime())) {
      this.snackBar.open('Укажите корректную дату занятия', 'Закрыть', {
        duration: 3000,
      });

      return;
    }

    this.submitting.set(true);

    this.teacherService
      .createLesson({
        subjectId: subject.id,

        groupId: value.groupId,

        semesterId: value.semesterId,

        title: value.title.trim(),

        type: value.type,

        date: date.toISOString(),

        duration: value.duration,

        description: value.description.trim(),

        location: value.location.trim(),
      })
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Занятие создано', 'Закрыть', {
            duration: 2500,
          });

          this.router.navigate(['/teacher/subjects', subject.id]);
        },

        error: (error) => {
          console.error('Ошибка создания занятия', error);

          this.snackBar.open(error.error?.message ?? 'Не удалось создать занятие', 'Закрыть', {
            duration: 4000,
          });
        },
      });
  }

  private loadData(): void {
    if (!this.subjectId) {
      this.error.set('Не указана дисциплина');

      this.loading.set(false);

      return;
    }

    forkJoin({
      subjects: this.teacherService.getSubjects(),

      semesters: this.teacherService.getSemesters(),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: ({ subjects, semesters }) => {
          this.subjects.set(subjects);

          this.semesters.set(semesters);

          const subject = subjects.find((item) => item.id === this.subjectId);

          if (!subject) {
            this.error.set('Дисциплина не найдена или недоступна');

            return;
          }

          /*
           * Если назначена одна группа,
           * выбираем автоматически.
           */
          if (subject.groups.length === 1) {
            this.form.controls.groupId.setValue(subject.groups[0].id);
          }

          /*
           * Если семестр один —
           * тоже выбираем.
           */
          if (semesters.length === 1) {
            this.form.controls.semesterId.setValue(semesters[0].id);
          }
        },

        error: (error) => {
          console.error(error);

          this.error.set('Не удалось загрузить данные для создания занятия');
        },
      });
  }
}
