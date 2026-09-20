import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
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
  TeacherService,
  TeacherSubject,
} from '../../services/teacher.service';
import { DatePipe } from '@angular/common';


@Component({
  selector:
    'app-teacher-subjects',

  standalone: true,

  imports: [
    RouterLink,
        DatePipe,
    MatIconModule,
    MatProgressSpinnerModule,
  ],

  templateUrl:
    './teacher-subjects.html',

  styleUrl:
    './teacher-subjects.scss',
})
export class TeacherSubjects {
  private readonly service =
    inject(TeacherService);

  readonly subjects =
    signal<
      TeacherSubject[]
    >([]);

  readonly loading =
    signal(true);

  readonly error =
    signal<string | null>(
      null,
    );

  readonly search =
    signal('');


  readonly filteredSubjects =
    computed(() => {
      const query =
        this.search()
          .trim()
          .toLocaleLowerCase(
            'ru',
          );

        
      if (!query) {
        return this.subjects();
      }


      return this.subjects()
        .filter(
          (subject) =>
            subject.name
              .toLocaleLowerCase(
                'ru',
              )
              .includes(query) ||

            subject.code
              ?.toLocaleLowerCase(
                'ru',
              )
              .includes(query) ||

            subject.department
              ?.name
              ?.toLocaleLowerCase(
                'ru',
              )
              .includes(query) ||

            subject.groups.some(
              (group) =>
                group.name
                  .toLocaleLowerCase(
                    'ru',
                  )
                  .includes(query),
            ),
        );
    });

  
  readonly groupsCount =
    computed(() => {
      const ids =
        this.subjects()
          .flatMap(
            (subject) =>
              subject.groups.map(
                (group) =>
                  group.id,
              ),
          );


      return new Set(ids)
        .size;
    });


  constructor() {
    this.loadSubjects();
    console.log(this.filteredSubjects)
  }


  setSearch(
    event: Event,
  ): void {
    const value =
      (
        event.target as
          HTMLInputElement
      ).value;

    this.search.set(
      value,
    );
  }


  subjectIcon(
    index: number,
  ): string {
    const icons = [
      'database',
      'code',
      'calculate',
      'language',
      'science',
      'account_balance',
      'psychology',
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

  this.service
    .getSubjects()
    .pipe(
      finalize(() => {
        this.loading.set(false);
      }),
    )
    .subscribe({
      next: (subjects) => {
        this.subjects.set(
          subjects.map((subject) => ({
            ...subject,

            lessonsCount:
              subject.lessonsCount ?? 0,

            homeworksCount:
              subject.homeworksCount ?? 0,

            submissionsCount:
              subject.submissionsCount ?? 0,

            pendingCount:
              subject.pendingCount ?? 0,

            averagePercent:
              subject.averagePercent ?? 0,

            nextLesson:
              subject.nextLesson ?? null,
          })),
        );
      },

      error: (error) => {
        console.error(error);

        this.error.set(
          'Не удалось загрузить дисциплины',
        );
      },
    });
}
readonly totalGroups = computed(() => {
  const ids =
    this.subjects().flatMap((subject) =>
      subject.groups.map((group) => group.id),
    );

  return new Set(ids).size;
});


readonly totalHomeworks = computed(() => {
  return this.subjects().reduce(
    (total, subject) =>
      total + subject.homeworksCount,
    0,
  );
});


readonly totalPending = computed(() => {
  return this.subjects().reduce(
    (total, subject) =>
      total + subject.pendingCount,
    0,
  );
});
resultClass(percent: number): string {
  if (percent >= 80) {
    return 'excellent';
  }

  if (percent >= 60) {
    return 'good';
  }

  if (percent >= 40) {
    return 'average';
  }

  return 'low';
}


resultLabel(percent: number): string {
  if (percent >= 80) {
    return 'Отлично';
  }

  if (percent >= 60) {
    return 'Хорошо';
  }

  if (percent >= 40) {
    return 'Удовлетворительно';
  }

  return 'Требует внимания';
}
}