import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import {
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';

import {
  TeacherService,
} from '../../services/teacher.service';

type HomeworkFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'OVERDUE'
  | 'PENDING';

@Component({
  selector: 'app-teacher-homeworks',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './teacher-homeworks.html',
  styleUrl: './teacher-homeworks.scss',
})
export class TeacherHomeworks {
  private readonly teacherService =
    inject(TeacherService);

  readonly homeworks = signal<any[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly search = signal('');
  readonly activeFilter =
    signal<HomeworkFilter>('ALL');

  readonly totalSubmissions = computed(() => {
    return this.homeworks().reduce(
      (total, homework) =>
        total +
        (homework.submissions?.length ?? 0),
      0,
    );
  });

  readonly pendingSubmissions = computed(() => {
    return this.homeworks().reduce(
      (total, homework) =>
        total +
        this.pendingCount(homework),
      0,
    );
  });

  readonly gradedSubmissions = computed(() => {
    return this.homeworks().reduce(
      (total, homework) =>
        total +
        this.gradedCount(homework),
      0,
    );
  });

  readonly activeHomeworksCount = computed(() => {
    return this.homeworks().filter(
      (homework) => !this.isOverdue(homework),
    ).length;
  });

  readonly overdueHomeworksCount = computed(() => {
    return this.homeworks().filter(
      (homework) => this.isOverdue(homework),
    ).length;
  });

  readonly filteredHomeworks = computed(() => {
    const query = this.search()
      .trim()
      .toLocaleLowerCase('ru');

    const filter = this.activeFilter();

    return [...this.homeworks()]
      .filter((homework) => {
        if (!query) {
          return true;
        }

        const subjectName =
          homework.subject?.name ?? '';

        const groupName =
          homework.lesson?.group?.name ?? '';

        return (
          homework.title
            ?.toLocaleLowerCase('ru')
            .includes(query) ||
          homework.description
            ?.toLocaleLowerCase('ru')
            .includes(query) ||
          subjectName
            .toLocaleLowerCase('ru')
            .includes(query) ||
          groupName
            .toLocaleLowerCase('ru')
            .includes(query)
        );
      })
      .filter((homework) => {
        switch (filter) {
          case 'ACTIVE':
            return !this.isOverdue(homework);

          case 'OVERDUE':
            return this.isOverdue(homework);

          case 'PENDING':
            return this.pendingCount(homework) > 0;

          default:
            return true;
        }
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      );
  });

  constructor() {
    this.loadHomeworks();
  }

  setSearch(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    this.search.set(input.value);
  }

  setFilter(
    filter: HomeworkFilter,
  ): void {
    this.activeFilter.set(filter);
  }

  pendingCount(homework: any): number {
    return (
      homework.submissions?.filter(
        (submission: any) =>
          submission.status === 'SUBMITTED',
      ).length ?? 0
    );
  }

  gradedCount(homework: any): number {
    return (
      homework.submissions?.filter(
        (submission: any) =>
          submission.status === 'GRADED',
      ).length ?? 0
    );
  }

  submissionsCount(homework: any): number {
    return homework.submissions?.length ?? 0;
  }

  isOverdue(homework: any): boolean {
    return (
      new Date(homework.deadline).getTime() <
      Date.now()
    );
  }

  homeworkStatus(
    homework: any,
  ): string {
    if (this.pendingCount(homework) > 0) {
      return 'Требует проверки';
    }

    if (this.isOverdue(homework)) {
      return 'Срок истёк';
    }

    return 'Активно';
  }

  homeworkStatusClass(
    homework: any,
  ): string {
    if (this.pendingCount(homework) > 0) {
      return 'pending';
    }

    if (this.isOverdue(homework)) {
      return 'overdue';
    }

    return 'active';
  }

  completionPercent(
    homework: any,
  ): number {
    const total =
      this.submissionsCount(homework);

    if (!total) {
      return 0;
    }

    return Math.round(
      (this.gradedCount(homework) / total) *
        100,
    );
  }

  private loadHomeworks(): void {
    this.loading.set(true);
    this.error.set(null);

    this.teacherService
      .getHomeworks()
      .subscribe({
        next: (response) => {
          this.homeworks.set(
            response ?? [],
          );

          this.loading.set(false);
        },

        error: (error) => {
          console.error(
            'Ошибка загрузки домашних заданий',
            error,
          );

          this.error.set(
            error.error?.message ??
              'Не удалось загрузить домашние задания',
          );

          this.loading.set(false);
        },
      });
  }
}