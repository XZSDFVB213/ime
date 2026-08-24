import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { finalize, forkJoin } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TeacherService } from '../../services/teacher.service';

import { TeacherSessionService } from '../../services/teacher-session.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  private readonly teacherService = inject(TeacherService);

  readonly session = inject(TeacherSessionService);

  readonly lessons = signal<any[]>([]);
  readonly homeworks = signal<any[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly todayLabel = this.formatToday();

  readonly sortedLessons = computed(() => {
    return [...this.lessons()].sort(
      (first, second) => new Date(first.date).getTime() - new Date(second.date).getTime(),
    );
  });

  readonly todayLessons = computed(() => {
    const today = new Date();

    return this.sortedLessons().filter((lesson) => this.isSameDay(new Date(lesson.date), today));
  });

  readonly upcomingLessons = computed(() => {
    const now = Date.now();

    return this.sortedLessons()
      .filter((lesson) => new Date(lesson.date).getTime() >= now)
      .slice(0, 5);
  });

  readonly pendingSubmissionsCount = computed(() => {
    return this.homeworks().reduce((total, homework) => {
      return total + this.pendingCount(homework);
    }, 0);
  });

  readonly gradedSubmissionsCount = computed(() => {
    return this.homeworks().reduce((total, homework) => {
      const graded =
        homework.submissions?.filter((submission: any) => submission.status === 'GRADED').length ??
        0;

      return total + graded;
    }, 0);
  });

  readonly homeworksWithPending = computed(() => {
    return [...this.homeworks()]
      .filter((homework) => this.pendingCount(homework) > 0)
      .sort((first, second) => this.pendingCount(second) - this.pendingCount(first))
      .slice(0, 5);
  });

  readonly recentHomeworks = computed(() => {
    return [...this.homeworks()]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      )
      .slice(0, 5);
  });

  constructor() {
    this.loadDashboard();
  }

  pendingCount(homework: any): number {
    return (
      homework.submissions?.filter((submission: any) => submission.status === 'SUBMITTED').length ??
      0
    );
  }

  submissionsCount(homework: any): number {
    return homework.submissions?.length ?? 0;
  }

  gradedCount(homework: any): number {
    return (
      homework.submissions?.filter((submission: any) => submission.status === 'GRADED').length ?? 0
    );
  }

  lessonEndTime(lesson: any): Date {
    const start = new Date(lesson.date);

    return new Date(start.getTime() + Number(lesson.duration ?? 90) * 60_000);
  }

  lessonType(type: string): string {
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

  lessonTypeClass(type: string): string {
    switch (type) {
      case 'LECTURE':
        return 'lecture';

      case 'PRACTICE':
        return 'practice';

      case 'SEMINAR':
        return 'seminar';

      case 'LAB':
        return 'lab';

      default:
        return 'default';
    }
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      lessons: this.teacherService.getLessons(),

      homeworks: this.teacherService.getHomeworks(),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (result) => {
          this.lessons.set(result.lessons ?? []);

          this.homeworks.set(result.homeworks ?? []);
        },

        error: (error) => {
          console.error('Ошибка загрузки кабинета', error);

          this.error.set(error.error?.message ?? 'Не удалось загрузить данные кабинета');
        },
      });
  }

  private isSameDay(first: Date, second: Date): boolean {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  private formatToday(): string {
    const formatted = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}
