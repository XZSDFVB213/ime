import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { catchError, finalize, forkJoin, of } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TeacherService, TeacherSubject } from '../../services/teacher.service';

type SubjectTab = 'OVERVIEW' | 'LESSONS' | 'HOMEWORKS' | 'PERFORMANCE';

interface StudentPerformance {
  studentId: string;
  fullName: string;
  email: string | null;

  submissions: number;
  graded: number;

  totalScore: number;
  totalMaxScore: number;

  percent: number;
}

@Component({
  selector: 'app-teacher-subject-details',
  standalone: true,

  imports: [DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule],

  templateUrl: './teacher-subjects-details.html',
  styleUrl: './teacher-subjects-details.scss',
})
export class TeacherSubjectDetails {
  private readonly route = inject(ActivatedRoute);
  readonly allSubjects = signal<TeacherSubject[]>([]);

  private readonly teacherService = inject(TeacherService);

  readonly subjectId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly lessons = signal<any[]>([]);
  readonly homeworks = signal<any[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly activeTab = signal<SubjectTab>('OVERVIEW');

  readonly subjectLessons = computed(() => {
    return this.lessons()
      .filter(
        (lesson) => lesson.subject?.id === this.subjectId || lesson.subjectId === this.subjectId,
      )
      .sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime());
  });

  readonly subjectHomeworks = computed(() => {
    return this.homeworks()
      .filter(
        (homework) =>
          homework.subject?.id === this.subjectId || homework.subjectId === this.subjectId,
      )
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      );
  });

  readonly subject = computed<TeacherSubject | null>(() => {
    return this.allSubjects().find((subject) => subject.id === this.subjectId) ?? null;
  });

  readonly groups = computed(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
      }
    >();

    /*
     * Главный источник —
     * назначения преподавателя.
     */
    for (const group of this.subject()?.groups ?? []) {
      map.set(group.id, {
        id: group.id,
        name: group.name,
      });
    }

    /*
     * Дополнительно собираем
     * из существующих занятий.
     */
    for (const lesson of this.subjectLessons()) {
      const group = lesson.group;

      if (group?.id) {
        map.set(group.id, {
          id: group.id,
          name: group.name,
        });
      }
    }

    /*
     * И из домашних заданий.
     */
    for (const homework of this.subjectHomeworks()) {
      const group = homework.lesson?.group;

      if (group?.id) {
        map.set(group.id, {
          id: group.id,
          name: group.name,
        });
      }
    }

    return Array.from(map.values()).sort((first, second) =>
      first.name.localeCompare(second.name, 'ru'),
    );
  });

  readonly allSubmissions = computed(() => {
    return this.subjectHomeworks().flatMap((homework) => homework.submissions ?? []);
  });

  readonly pendingCount = computed(() => {
    return this.allSubmissions().filter((submission: any) => submission.status === 'SUBMITTED')
      .length;
  });

  readonly gradedCount = computed(() => {
    return this.allSubmissions().filter((submission: any) => submission.status === 'GRADED').length;
  });

  readonly averagePercent = computed(() => {
    const percentages: number[] = [];

    for (const homework of this.subjectHomeworks()) {
      const maxScore = Number(homework.maxScore) || 100;

      for (const submission of homework.submissions ?? []) {
        if (submission.status !== 'GRADED' || typeof submission.score !== 'number') {
          continue;
        }

        percentages.push((submission.score / maxScore) * 100);
      }
    }

    if (!percentages.length) {
      return 0;
    }

    return Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length);
  });

  readonly nextLesson = computed(() => {
    const now = Date.now();

    return (
      this.subjectLessons().find((lesson) => this.lessonEndTime(lesson).getTime() >= now) ?? null
    );
  });

  readonly studentPerformance = computed<StudentPerformance[]>(() => {
    const students = new Map<string, StudentPerformance>();

    for (const homework of this.subjectHomeworks()) {
      const maxScore = Number(homework.maxScore) || 100;

      for (const submission of homework.submissions ?? []) {
        const student = submission.student;

        if (!student?.id) {
          continue;
        }

        let item = students.get(student.id);

        if (!item) {
          item = {
            studentId: student.id,

            fullName: student.user?.fullName ?? 'Обучающийся',

            email: student.user?.email ?? null,

            submissions: 0,
            graded: 0,

            totalScore: 0,
            totalMaxScore: 0,

            percent: 0,
          };

          students.set(student.id, item);
        }

        item.submissions++;

        if (submission.status === 'GRADED' && typeof submission.score === 'number') {
          item.graded++;

          item.totalScore += submission.score;

          item.totalMaxScore += maxScore;
        }
      }
    }

    for (const student of students.values()) {
      student.percent = student.totalMaxScore
        ? Math.round((student.totalScore / student.totalMaxScore) * 100)
        : 0;
    }

    return Array.from(students.values()).sort((first, second) => second.percent - first.percent);
  });
  readonly deletingLessonId = signal<string | null>(null);

  isAssessmentLesson(lesson: any): boolean {
    return lesson.type === 'EXAM' || lesson.type === 'CREDIT';
  }

  canCreateHomework(lesson: any): boolean {
    return lesson.type !== 'EXAM' && lesson.type !== 'CREDIT' && lesson.type !== 'CONSULTATION';
  }

  deleteLesson(lesson: any): void {
    if (this.deletingLessonId()) {
      return;
    }

    const confirmed = window.confirm(`Удалить занятие «${lesson.title}»?`);

    if (!confirmed) {
      return;
    }

    this.deletingLessonId.set(lesson.id);

    this.teacherService
      .deleteLesson(lesson.id)
      .pipe(
        finalize(() => {
          this.deletingLessonId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.lessons.update((lessons) => lessons.filter((item) => item.id !== lesson.id));
        },

        error: (error) => {
          console.error('Ошибка удаления занятия', error);

          window.alert(error.error?.message ?? 'Не удалось удалить занятие');
        },
      });
  }
  constructor() {
    this.loadData();
  }

  setTab(tab: SubjectTab): void {
    this.activeTab.set(tab);
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

      case 'CONSULTATION':
        return 'Консультация';

      case 'CREDIT':
        return 'Зачёт';

      case 'EXAM':
        return 'Экзамен';

      default:
        return 'Занятие';
    }
  }

  homeworkPendingCount(homework: any): number {
    return (
      homework.submissions?.filter((submission: any) => submission.status === 'SUBMITTED').length ??
      0
    );
  }

  homeworkGradedCount(homework: any): number {
    return (
      homework.submissions?.filter((submission: any) => submission.status === 'GRADED').length ?? 0
    );
  }

  homeworkStatus(homework: any): string {
    if (this.homeworkPendingCount(homework) > 0) {
      return 'На проверке';
    }

    if (new Date(homework.deadline).getTime() < Date.now()) {
      return 'Срок истёк';
    }

    return 'Активно';
  }

  homeworkStatusClass(homework: any): string {
    if (this.homeworkPendingCount(homework) > 0) {
      return 'pending';
    }

    if (new Date(homework.deadline).getTime() < Date.now()) {
      return 'overdue';
    }

    return 'active';
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

  studentInitials(fullName: string): string {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  private loadData(): void {
    if (!this.subjectId) {
      this.error.set('Не указан ID дисциплины');

      this.loading.set(false);

      return;
    }

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      /*
       * Назначенные преподавателю дисциплины.
       *
       * ЭТО источник истины для проверки
       * доступа к дисциплине.
       */
      subjects: this.teacherService.getSubjects(),

      /*
       * Занятия и ДЗ теперь только
       * наполнение дисциплины.
       */
      lessons: this.teacherService.getLessons().pipe(catchError(() => of([]))),

      homeworks: this.teacherService.getHomeworks().pipe(catchError(() => of([]))),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: ({ subjects, lessons, homeworks }) => {
          this.allSubjects.set(subjects ?? []);

          this.lessons.set(lessons ?? []);

          this.homeworks.set(homeworks ?? []);

          /*
           * Проверяем именно назначение
           * преподавателю, а НЕ наличие
           * Lesson/Homework.
           */
          const subjectExists = subjects.some((subject) => subject.id === this.subjectId);

          if (!subjectExists) {
            this.error.set('Дисциплина не найдена или недоступна');

            return;
          }

          /*
           * Даже если по дисциплине:
           *
           * lessons = []
           * homeworks = []
           *
           * это НЕ ошибка.
           */
          this.error.set(null);
        },

        error: (error) => {
          console.error('[TEACHER SUBJECT DETAILS]', error);

          this.error.set('Не удалось загрузить дисциплину');
        },
      });
  }
}
