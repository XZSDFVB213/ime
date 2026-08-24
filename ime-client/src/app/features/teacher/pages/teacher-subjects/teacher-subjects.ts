import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  catchError,
  finalize,
  forkJoin,
  of,
} from 'rxjs';

import { MatIconModule } from '@angular/material/icon';

import {
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';

import {
  TeacherService,
} from '../../services/teacher.service';

interface TeacherSubject {
  id: string;

  name: string;
  code: string | null;
  description: string | null;
  credits: number | null;

  groups: {
    id: string;
    name: string;
  }[];

  lessonsCount: number;
  homeworksCount: number;

  submissionsCount: number;
  pendingCount: number;
  gradedCount: number;

  averagePercent: number;

  nextLesson: any | null;
}

@Component({
  selector: 'app-teacher-subjects',
  standalone: true,

  imports: [
    DatePipe,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
  ],

  templateUrl: './teacher-subjects.html',
  styleUrl: './teacher-subjects.scss',
})
export class TeacherSubjects {
  private readonly teacherService =
    inject(TeacherService);

  readonly lessons = signal<any[]>([]);
  readonly homeworks = signal<any[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly search = signal('');

  readonly subjects = computed<TeacherSubject[]>(() => {
    const map =
      new Map<string, TeacherSubject>();

    const now = Date.now();

    /*
     * Сначала собираем дисциплины
     * по занятиям.
     */
    for (const lesson of this.lessons()) {
      const subject = lesson.subject;

      if (!subject?.id) {
        continue;
      }

      let item = map.get(subject.id);

      if (!item) {
        item = {
          id: subject.id,

          name:
            subject.name ??
            'Без названия',

          code:
            subject.code ?? null,

          description:
            subject.description ?? null,

          credits:
            subject.credits ?? null,

          groups: [],

          lessonsCount: 0,
          homeworksCount: 0,

          submissionsCount: 0,
          pendingCount: 0,
          gradedCount: 0,

          averagePercent: 0,

          nextLesson: null,
        };

        map.set(
          subject.id,
          item,
        );
      }

      item.lessonsCount++;

      const group =
        lesson.group;

      if (
        group?.id &&
        !item.groups.some(
          (existing) =>
            existing.id === group.id,
        )
      ) {
        item.groups.push({
          id: group.id,
          name: group.name,
        });
      }

      const lessonDate =
        new Date(lesson.date).getTime();

      if (lessonDate >= now) {
        if (
          !item.nextLesson ||
          lessonDate <
            new Date(
              item.nextLesson.date,
            ).getTime()
        ) {
          item.nextLesson =
            lesson;
        }
      }
    }

    /*
     * Затем добавляем статистику
     * домашних заданий.
     */
    for (const homework of this.homeworks()) {
      const subject =
        homework.subject;

      if (!subject?.id) {
        continue;
      }

      let item =
        map.get(subject.id);

      /*
       * На случай если предмет есть
       * в домашних заданиях,
       * но занятия API почему-то
       * не вернул.
       */
      if (!item) {
        item = {
          id: subject.id,

          name:
            subject.name ??
            'Без названия',

          code:
            subject.code ?? null,

          description:
            subject.description ?? null,

          credits:
            subject.credits ?? null,

          groups: [],

          lessonsCount: 0,
          homeworksCount: 0,

          submissionsCount: 0,
          pendingCount: 0,
          gradedCount: 0,

          averagePercent: 0,

          nextLesson: null,
        };

        map.set(
          subject.id,
          item,
        );
      }

      item.homeworksCount++;

      const group =
        homework.lesson?.group;

      if (
        group?.id &&
        !item.groups.some(
          (existing) =>
            existing.id === group.id,
        )
      ) {
        item.groups.push({
          id: group.id,
          name: group.name,
        });
      }

      const submissions =
        homework.submissions ?? [];

      item.submissionsCount +=
        submissions.length;

      item.pendingCount +=
        submissions.filter(
          (submission: any) =>
            submission.status ===
            'SUBMITTED',
        ).length;

      item.gradedCount +=
        submissions.filter(
          (submission: any) =>
            submission.status ===
            'GRADED',
        ).length;
    }

    /*
     * Считаем средний %
     * по проверенным работам.
     *
     * Нормализуем:
     * score / maxScore * 100
     */
    for (const item of map.values()) {
      const percentages: number[] = [];

      const subjectHomeworks =
        this.homeworks().filter(
          (homework) =>
            homework.subject?.id ===
            item.id,
        );

      for (
        const homework of
        subjectHomeworks
      ) {
        const maxScore =
          Number(
            homework.maxScore,
          ) || 100;

        for (
          const submission of
          homework.submissions ?? []
        ) {
          if (
            submission.status !==
              'GRADED' ||
            typeof submission.score !==
              'number'
          ) {
            continue;
          }

          percentages.push(
            Math.round(
              (submission.score /
                maxScore) *
                100,
            ),
          );
        }
      }

      item.averagePercent =
        percentages.length
          ? Math.round(
              percentages.reduce(
                (sum, value) =>
                  sum + value,
                0,
              ) /
                percentages.length,
            )
          : 0;

      item.groups.sort(
        (first, second) =>
          first.name.localeCompare(
            second.name,
            'ru',
          ),
      );
    }

    return Array.from(
      map.values(),
    ).sort(
      (first, second) =>
        first.name.localeCompare(
          second.name,
          'ru',
        ),
    );
  });

  readonly filteredSubjects = computed(() => {
    const query = this.search()
      .trim()
      .toLocaleLowerCase('ru');

    if (!query) {
      return this.subjects();
    }

    return this.subjects().filter(
      (subject) => {
        return (
          subject.name
            .toLocaleLowerCase('ru')
            .includes(query) ||
          subject.code
            ?.toLocaleLowerCase('ru')
            .includes(query) ||
          subject.groups.some(
            (group) =>
              group.name
                .toLocaleLowerCase('ru')
                .includes(query),
          )
        );
      },
    );
  });

  readonly totalGroups = computed(() => {
    const groups =
      new Set<string>();

    for (
      const subject of
      this.subjects()
    ) {
      for (
        const group of
        subject.groups
      ) {
        groups.add(group.id);
      }
    }

    return groups.size;
  });

  readonly totalPending = computed(() => {
    return this.subjects().reduce(
      (total, subject) =>
        total +
        subject.pendingCount,
      0,
    );
  });

  readonly totalHomeworks = computed(() => {
    return this.subjects().reduce(
      (total, subject) =>
        total +
        subject.homeworksCount,
      0,
    );
  });

  constructor() {
    this.loadSubjects();
  }

  setSearch(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    this.search.set(
      input.value,
    );
  }

  resultLabel(
    percent: number,
  ): string {
    if (!percent) {
      return 'Нет оценок';
    }

    if (percent >= 85) {
      return 'Отлично';
    }

    if (percent >= 70) {
      return 'Хорошо';
    }

    if (percent >= 60) {
      return 'Зачтено';
    }

    return 'Требует внимания';
  }

  resultClass(
    percent: number,
  ): string {
    if (!percent) {
      return 'empty';
    }

    if (percent >= 85) {
      return 'excellent';
    }

    if (percent >= 70) {
      return 'good';
    }

    if (percent >= 60) {
      return 'passed';
    }

    return 'low';
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
      index % classes.length
    ];
  }

  subjectIcon(
    index: number,
  ): string {
    const icons = [
      'database',
      'code',
      'calculate',
      'psychology',
      'public',
      'account_balance',
    ];

    return icons[
      index % icons.length
    ];
  }

  private loadSubjects(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      lessons:
        this.teacherService
          .getLessons()
          .pipe(
            catchError(() =>
              of([]),
            ),
          ),

      homeworks:
        this.teacherService
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
        next: (response) => {
          this.lessons.set(
            response.lessons ?? [],
          );

          this.homeworks.set(
            response.homeworks ?? [],
          );
        },

        error: (error) => {
          console.error(
            'Ошибка загрузки дисциплин',
            error,
          );

          this.error.set(
            'Не удалось загрузить дисциплины',
          );
        },
      });
  }
}