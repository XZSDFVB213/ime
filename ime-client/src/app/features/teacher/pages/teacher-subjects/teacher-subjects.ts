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


@Component({
  selector:
    'app-teacher-subjects',

  standalone: true,

  imports: [
    RouterLink,
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
          this.loading.set(
            false,
          );
        }),
      )
      .subscribe({
        next: (
          subjects,
        ) => {
          this.subjects.set(
            subjects,
          );
        },

        error: (
          error,
        ) => {
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