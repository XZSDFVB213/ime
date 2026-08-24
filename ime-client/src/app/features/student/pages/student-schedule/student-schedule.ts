import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StudentService } from '../../student.service';

type ScheduleMode = 'TODAY' | 'WEEK' | 'ALL';

interface ScheduleGroup {
  key: string;
  date: Date;
  label: string;
  lessons: any[];
}

@Component({
  selector: 'app-student-schedule',
  standalone: true,
  imports: [DatePipe, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './student-schedule.html',
  styleUrl: './student-schedule.scss',
})
export class StudentSchedule {
  private readonly service = inject(StudentService);

  readonly lessons = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly activeMode = signal<ScheduleMode>('WEEK');

  readonly filteredLessons = computed(() => {
    const lessons = [...this.lessons()].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const mode = this.activeMode();

    if (mode === 'ALL') {
      return lessons;
    }

    const now = new Date();

    if (mode === 'TODAY') {
      return lessons.filter((lesson) => this.isSameDay(new Date(lesson.date), now));
    }

    const weekStart = this.getWeekStart(now);
    const weekEnd = new Date(weekStart);

    weekEnd.setDate(weekEnd.getDate() + 7);

    return lessons.filter((lesson) => {
      const date = new Date(lesson.date);

      return date >= weekStart && date < weekEnd;
    });
  });

  readonly groupedLessons = computed<ScheduleGroup[]>(() => {
    const groups = new Map<string, ScheduleGroup>();

    for (const lesson of this.filteredLessons()) {
      const date = new Date(lesson.date);
      const key = this.dateKey(date);

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          date,
          label: this.formatDayLabel(date),
          lessons: [],
        });
      }

      groups.get(key)!.lessons.push(lesson);
    }

    return Array.from(groups.values());
  });

  constructor() {
    this.loadSchedule();
  }

  setMode(mode: ScheduleMode): void {
    this.activeMode.set(mode);
  }

  lessonEndTime(lesson: any): Date {
    const start = new Date(lesson.date);
    const duration = Number(lesson.duration ?? 90);

    return new Date(start.getTime() + duration * 60_000);
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

  lessonClass(type: string): string {
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

  isLessonPassed(lesson: any): boolean {
    return this.lessonEndTime(lesson).getTime() < Date.now();
  }

  isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  private loadSchedule(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getSchedule().subscribe({
      next: (response) => {
        this.lessons.set(response ?? []);
        this.loading.set(false);
      },

      error: (error) => {
        console.error(error);

        this.error.set(error.error?.message ?? 'Не удалось загрузить расписание');

        this.loading.set(false);
      },
    });
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    const day = result.getDay();
    const distanceToMonday = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + distanceToMonday);

    return result;
  }

  private isSameDay(first: Date, second: Date): boolean {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  private dateKey(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private formatDayLabel(date: Date): string {
    const label = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);

    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
