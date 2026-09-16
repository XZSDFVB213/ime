import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  DatePipe,
} from '@angular/common';

import {
  RouterLink,
} from '@angular/router';

import {
  catchError,
  finalize,
  forkJoin,
  of,
} from 'rxjs';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';

import {
  StudentService,
  StudentSubject,
} from '../../student.service';


@Component({
  selector: 'app-student-subjects',

  standalone: true,

  imports: [
    DatePipe,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
  ],

  templateUrl:
    './student-subjects.html',

  styleUrl:
    './student-subjects.scss',
})
export class StudentSubjects {
  private readonly service =
    inject(StudentService);


  readonly subjects =
    signal<StudentSubject[]>([]);

  readonly loading =
    signal(true);

  readonly error =
    signal<string | null>(null);

  readonly search =
    signal('');


  readonly filteredSubjects =
    computed(() => {
      const query =
        this.search()
          .trim()
          .toLocaleLowerCase('ru');


      if (!query) {
        return this.subjects();
      }


      return this.subjects()
        .filter((subject) => {
          return (
            subject.name
              .toLocaleLowerCase('ru')
              .includes(query) ||

            subject.code
              ?.toLocaleLowerCase('ru')
              .includes(query) ||

            subject.teacher
              ?.user
              ?.fullName
              ?.toLocaleLowerCase('ru')
              .includes(query) ||

            subject.department
              ?.name
              ?.toLocaleLowerCase('ru')
              .includes(query)
          );
        });
    });


  constructor() {
    this.loadSubjects();
  }


  setSearch(
    event: Event,
  ): void {
    const value =
      (
        event.target as
          HTMLInputElement
      ).value;

    this.search.set(value);
  }


  homeworkProgress(
    subject: StudentSubject,
  ): number {
    if (
      !subject.homeworksCount
    ) {
      return 0;
    }


    return Math.round(
      (
        subject.completedHomeworksCount /
        subject.homeworksCount
      ) * 100,
    );
  }


  subjectIcon(
    index: number,
  ): string {
    const icons = [
      'database',
      'calculate',
      'language',
      'monitoring',
      'account_balance',
      'psychology',
      'code',
      'public',
    ];


    return icons[
      index %
        icons.length
    ];
  }


  subjectClass(
    index: number,
  ): string {
    const classes = [
      'blue',
      'purple',
      'green',
      'orange',
      'cyan',
      'red',
    ];


    return classes[
      index %
        classes.length
    ];
  }


  private loadSubjects(): void {
    this.loading.set(true);
    this.error.set(null);


    forkJoin({
      /*
       * Источник истины:
       * назначения администратором.
       */
      subjects:
        this.service
          .getSubjects(),

      /*
       * Эти два нужны только
       * для статистики карточки.
       */
      lessons:
        this.service
          .getSchedule()
          .pipe(
            catchError(() =>
              of([]),
            ),
          ),

      homeworks:
        this.service
          .getHomeworks()
          .pipe(
            catchError(() =>
              of([]),
            ),
          ),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: ({
          subjects,
          lessons,
          homeworks,
        }) => {
          const result =
            subjects.map(
              (subject) => {
                const subjectLessons =
                  lessons.filter(
                    (lesson: any) =>
                      lesson.subject
                        ?.id ===
                      subject.id,
                  );


                const subjectHomeworks =
                  homeworks.filter(
                    (homework: any) =>
                      homework.subject
                        ?.id ===
                      subject.id,
                  );


                const completedHomeworksCount =
                  subjectHomeworks
                    .filter(
                      (
                        homework:
                          any,
                      ) =>
                        homework
                          .submissions
                          ?.[0]
                          ?.status ===
                        'GRADED',
                    )
                    .length;


                const nextLesson =
                  subjectLessons
                    .filter(
                      (
                        lesson:
                          any,
                      ) =>
                        new Date(
                          lesson.date,
                        ).getTime() >
                        Date.now(),
                    )
                    .sort(
                      (
                        first:
                          any,
                        second:
                          any,
                      ) =>
                        new Date(
                          first.date,
                        ).getTime() -
                        new Date(
                          second.date,
                        ).getTime(),
                    )[0] ??
                  null;


                return {
                  ...subject,

                  lessonsCount:
                    subjectLessons.length,

                  homeworksCount:
                    subjectHomeworks.length,

                  completedHomeworksCount,

                  nextLesson,
                };
              },
            );


          this.subjects.set(
            result,
          );
        },

        error: (error) => {
          console.error(
            error,
          );

          this.error.set(
            'Не удалось загрузить дисциплины',
          );
        },
      });
  }
}