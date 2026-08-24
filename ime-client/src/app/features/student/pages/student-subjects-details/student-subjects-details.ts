import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { catchError, finalize, forkJoin, of } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StudentService } from '../../student.service';

type SubjectTab = 'OVERVIEW' | 'LESSONS' | 'HOMEWORKS';

@Component({
  selector: 'app-student-subject-details',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './student-subjects-details.html',
  styleUrl: './student-subjects-details.scss',
})
export class StudentSubjectDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(StudentService);

  readonly subjectId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly allLessons = signal<any[]>([]);
  readonly allHomeworks = signal<any[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly activeTab = signal<SubjectTab>('OVERVIEW');

  readonly lessons = computed(() =>
    this.allLessons()
      .filter((lesson) => lesson.subject?.id === this.subjectId)
      .sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime()),
  );

  readonly homeworks = computed(() =>
    this.allHomeworks()
      .filter((homework) => homework.subject?.id === this.subjectId)
      .sort(
        (first, second) => new Date(first.deadline).getTime() - new Date(second.deadline).getTime(),
      ),
  );

  readonly subject = computed(() => {
    return this.lessons()[0]?.subject ?? this.homeworks()[0]?.subject ?? null;
  });

  readonly teacher = computed(() => {
    return this.lessons()[0]?.teacher?.user ?? this.homeworks()[0]?.teacher?.user ?? null;
  });

  readonly nextLesson = computed(() => {
    const now = Date.now();

    return this.lessons().find((lesson) => new Date(lesson.date).getTime() >= now) ?? null;
  });

  readonly completedHomeworks = computed(() => {
    return this.homeworks().filter((homework) => {
      return homework.submissions?.[0]?.status === 'GRADED';
    }).length;
  });

  readonly submittedHomeworks = computed(() => {
    return this.homeworks().filter((homework) => {
      return homework.submissions?.[0]?.status === 'SUBMITTED';
    }).length;
  });

  readonly progress = computed(() => {
    const total = this.homeworks().length;

    if (!total) {
      return 0;
    }

    return Math.round((this.completedHomeworks() / total) * 100);
  });

  readonly averageScore = computed(() => {
    const scores = this.homeworks()
      .map((homework) => homework.submissions?.[0]?.score)
      .filter((score): score is number => typeof score === 'number');

    if (!scores.length) {
      return 0;
    }

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  });

  constructor() {
    this.loadSubject();
  }

  setTab(tab: SubjectTab): void {
    this.activeTab.set(tab);
  }

  submission(homework: any): any | null {
    return homework.submissions?.[0] ?? null;
  }

  homeworkStatus(homework: any): string {
    const status = this.submission(homework)?.status;

    switch (status) {
      case 'SUBMITTED':
        return 'На проверке';

      case 'GRADED':
        return 'Проверено';

      case 'DRAFT':
        return 'Черновик';

      default:
        return 'Нужно выполнить';
    }
  }

  homeworkStatusClass(homework: any): string {
    const status = this.submission(homework)?.status;

    switch (status) {
      case 'SUBMITTED':
        return 'review';

      case 'GRADED':
        return 'completed';

      case 'DRAFT':
        return 'draft';

      default:
        return 'current';
    }
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

  private loadSubject(): void {
    if (!this.subjectId) {
      this.error.set('Не указан идентификатор дисциплины');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      lessons: this.service.getSchedule().pipe(catchError(() => of([]))),

      homeworks: this.service.getHomeworks().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((result) => {
        this.allLessons.set(result.lessons);
        this.allHomeworks.set(result.homeworks);

        if (!this.lessons().length && !this.homeworks().length) {
          this.error.set('Дисциплина не найдена или недоступна');
        }
      });
  }
}
