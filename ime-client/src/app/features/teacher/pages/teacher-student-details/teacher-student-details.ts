import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { catchError, finalize, forkJoin, of } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TeacherService } from '../../services/teacher.service';

type StudentTab = 'OVERVIEW' | 'HOMEWORKS' | 'SUBJECTS';

interface SubjectStat {
  id: string;
  name: string;
  code: string | null;

  assigned: number;
  submitted: number;
  graded: number;
  missing: number;

  score: number;
  maxScore: number;

  percent: number;
}

@Component({
  selector: 'app-teacher-student-details',
  standalone: true,

  imports: [DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule],

  templateUrl: './teacher-student-details.html',
  styleUrl: './teacher-student-details.scss',
})
export class TeacherStudentDetails {
  private readonly route = inject(ActivatedRoute);

  private readonly teacherService = inject(TeacherService);

  readonly studentId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly lessons = signal<any[]>([]);
  readonly homeworks = signal<any[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly activeTab = signal<StudentTab>('OVERVIEW');

  /*
   * Находим студента внутри групп,
   * где преподаватель ведёт занятия.
   */
  readonly student = computed(() => {
    for (const lesson of this.lessons()) {
      const student = lesson.group?.students?.find((item: any) => item.id === this.studentId);

      if (student) {
        return {
          ...student,

          group: {
            id: lesson.group.id,
            name: lesson.group.name,
          },
        };
      }
    }

    return null;
  });

  readonly studentLessons = computed(() => {
    return this.lessons()
      .filter((lesson) =>
        lesson.group?.students?.some((student: any) => student.id === this.studentId),
      )
      .sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime());
  });

  readonly subjects = computed(() => {
    const map = new Map<string, any>();

    for (const lesson of this.studentLessons()) {
      if (lesson.subject?.id) {
        map.set(lesson.subject.id, lesson.subject);
      }
    }

    return Array.from(map.values()).sort((first, second) =>
      first.name.localeCompare(second.name, 'ru'),
    );
  });

  /*
   * Все задания преподавателя,
   * предназначенные группе этого студента.
   */
  readonly studentHomeworks = computed(() => {
    const student = this.student();

    if (!student) {
      return [];
    }

    return this.homeworks()
      .filter((homework) => homework.lesson?.group?.id === student.group.id)
      .map((homework) => {
        const submission =
          homework.submissions?.find((item: any) => item.studentId === this.studentId) ?? null;

        return {
          ...homework,
          studentSubmission: submission,
        };
      })
      .sort(
        (first, second) => new Date(second.deadline).getTime() - new Date(first.deadline).getTime(),
      );
  });

  readonly submittedCount = computed(() => {
    return this.studentHomeworks().filter((homework) => {
      const status = homework.studentSubmission?.status;

      return status === 'SUBMITTED' || status === 'GRADED';
    }).length;
  });

  readonly gradedCount = computed(() => {
    return this.studentHomeworks().filter(
      (homework) => homework.studentSubmission?.status === 'GRADED',
    ).length;
  });

  readonly pendingCount = computed(() => {
    return this.studentHomeworks().filter(
      (homework) => homework.studentSubmission?.status === 'SUBMITTED',
    ).length;
  });

  readonly missingCount = computed(() => {
    return this.studentHomeworks().filter((homework) => {
      const status = homework.studentSubmission?.status;

      return !status || status === 'DRAFT';
    }).length;
  });

  readonly overdueMissingCount = computed(() => {
    return this.studentHomeworks().filter((homework) => {
      const status = homework.studentSubmission?.status;

      const missing = !status || status === 'DRAFT';

      return missing && new Date(homework.deadline).getTime() < Date.now();
    }).length;
  });

  readonly totalScore = computed(() => {
    return this.studentHomeworks().reduce((total, homework) => {
      const submission = homework.studentSubmission;

      if (submission?.status !== 'GRADED' || typeof submission.score !== 'number') {
        return total;
      }

      return total + submission.score;
    }, 0);
  });

  readonly totalMaxScore = computed(() => {
    return this.studentHomeworks().reduce((total, homework) => {
      if (homework.studentSubmission?.status !== 'GRADED') {
        return total;
      }

      return total + Number(homework.maxScore ?? 0);
    }, 0);
  });

  readonly averagePercent = computed(() => {
    if (!this.totalMaxScore()) {
      return 0;
    }

    return Math.round((this.totalScore() / this.totalMaxScore()) * 100);
  });

  readonly submissionPercent = computed(() => {
    const total = this.studentHomeworks().length;

    if (!total) {
      return 0;
    }

    return Math.round((this.submittedCount() / total) * 100);
  });

  readonly subjectStats = computed<SubjectStat[]>(() => {
    return this.subjects().map((subject) => {
      const homeworks = this.studentHomeworks().filter(
        (homework) => homework.subject?.id === subject.id || homework.subjectId === subject.id,
      );

      let submitted = 0;
      let graded = 0;
      let missing = 0;

      let score = 0;
      let maxScore = 0;

      for (const homework of homeworks) {
        const submission = homework.studentSubmission;

        if (submission?.status === 'SUBMITTED' || submission?.status === 'GRADED') {
          submitted++;
        } else {
          missing++;
        }

        if (submission?.status === 'GRADED' && typeof submission.score === 'number') {
          graded++;

          score += submission.score;

          maxScore += Number(homework.maxScore) || 0;
        }
      }

      return {
        id: subject.id,

        name: subject.name,

        code: subject.code ?? null,

        assigned: homeworks.length,

        submitted,
        graded,
        missing,

        score,
        maxScore,

        percent: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      };
    });
  });

  readonly nextLesson = computed(() => {
    const now = Date.now();

    return (
      this.studentLessons().find((lesson) => this.lessonEndTime(lesson).getTime() >= now) ?? null
    );
  });

  constructor() {
    this.loadData();
  }

  setTab(tab: StudentTab): void {
    this.activeTab.set(tab);
  }

  initials(fullName: string): string {
    return fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  lessonEndTime(lesson: any): Date {
    const start = new Date(lesson.date);

    return new Date(start.getTime() + Number(lesson.duration ?? 90) * 60_000);
  }

  submissionStatus(homework: any): string {
    const submission = homework.studentSubmission;

    if (submission?.status === 'GRADED') {
      return 'Проверено';
    }

    if (submission?.status === 'SUBMITTED') {
      return 'На проверке';
    }

    if (submission?.status === 'DRAFT') {
      return 'Черновик';
    }

    if (new Date(homework.deadline).getTime() < Date.now()) {
      return 'Не сдано';
    }

    return 'Не отправлено';
  }

  submissionStatusClass(homework: any): string {
    const submission = homework.studentSubmission;

    if (submission?.status === 'GRADED') {
      return 'graded';
    }

    if (submission?.status === 'SUBMITTED') {
      return 'pending';
    }

    if (new Date(homework.deadline).getTime() < Date.now()) {
      return 'missing';
    }

    return 'not-submitted';
  }

  performanceClass(percent: number): string {
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
      return 'normal';
    }

    return 'low';
  }

  performanceLabel(percent: number): string {
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
      return 'Удовлетворительно';
    }

    return 'Требует внимания';
  }

  private loadData(): void {
    if (!this.studentId) {
      this.error.set('Не указан ID обучающегося');

      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      lessons: this.teacherService.getLessons().pipe(catchError(() => of([]))),

      homeworks: this.teacherService.getHomeworks().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.lessons.set(response.lessons ?? []);

          this.homeworks.set(response.homeworks ?? []);

          if (!this.student()) {
            this.error.set('Обучающийся не найден');
          }
        },

        error: (error) => {
          console.error(error);

          this.error.set('Не удалось загрузить данные обучающегося');
        },
      });
  }
}
