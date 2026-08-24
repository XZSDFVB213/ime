import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TeacherService } from '../../services/teacher.service';

type ScheduleFilter = 'TODAY' | 'WEEK' | 'UPCOMING' | 'ALL';

interface DayGroup {
  key: string;
  date: Date;
  label: string;
  lessons: any[];
}

@Component({
  selector: 'app-teacher-schedule',
  standalone: true,
  imports: [DatePipe, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './teacher-schedule.html',
  styleUrl: './teacher-schedule.scss',
})
export class TeacherSchedule {
  private readonly teacherService = inject(TeacherService);

  private readonly router = inject(Router);

  readonly lessons = signal<any[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly activeFilter = signal<ScheduleFilter>('UPCOMING');

  readonly filteredLessons = computed(() => {
    const now = new Date();

    const lessons = [...this.lessons()].sort(
      (first, second) => new Date(first.date).getTime() - new Date(second.date).getTime(),
    );

    switch (this.activeFilter()) {
      case 'TODAY':
        return lessons.filter((lesson) => this.isSameDay(new Date(lesson.date), now));

      case 'WEEK': {
        const start = this.getWeekStart(now);

        const end = new Date(start);

        end.setDate(end.getDate() + 7);

        return lessons.filter((lesson) => {
          const date = new Date(lesson.date);

          return date >= start && date < end;
        });
      }

      case 'UPCOMING':
        return lessons.filter((lesson) => this.lessonEndTime(lesson).getTime() >= Date.now());

      default:
        return lessons;
    }
  });

  readonly groupedLessons = computed<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();

    for (const lesson of this.filteredLessons()) {
      const date = new Date(lesson.date);

      const key = this.dateKey(date);

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          date,
          label: this.formatDate(date),
          lessons: [],
        });
      }

      groups.get(key)!.lessons.push(lesson);
    }

    return Array.from(groups.values());
  });

  readonly totalGroups = computed(() => {
    const groups = new Set(
      this.lessons()
        .map((lesson) => lesson.group?.id)
        .filter(Boolean),
    );

    return groups.size;
  });

  readonly totalSubjects = computed(() => {
    const subjects = new Set(
      this.lessons()
        .map((lesson) => lesson.subject?.id)
        .filter(Boolean),
    );

    return subjects.size;
  });

  readonly upcomingCount = computed(() => {
    return this.lessons().filter((lesson) => this.lessonEndTime(lesson).getTime() >= Date.now())
      .length;
  });

  constructor() {
    this.loadSchedule();
  }

  setFilter(filter: ScheduleFilter): void {
    this.activeFilter.set(filter);
  }

  openCreateHomework(lessonId: string): void {
    this.router.navigate(['/teacher/homeworks/create', lessonId]);
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

  isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  isPassed(lesson: any): boolean {
    return this.lessonEndTime(lesson).getTime() < Date.now();
  }

  private loadSchedule(): void {
    this.loading.set(true);
    this.error.set(null);

    this.teacherService.getLessons().subscribe({
      next: (lessons) => {
        this.lessons.set(lessons ?? []);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Ошибка расписания', error);

        this.error.set(error.error?.message ?? 'Не удалось загрузить расписание');

        this.loading.set(false);
      },
    });
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    const day = result.getDay();

    const offset = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + offset);

    return result;
  }

  private dateKey(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private isSameDay(first: Date, second: Date): boolean {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  private formatDate(date: Date): string {
    const value = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);

    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
