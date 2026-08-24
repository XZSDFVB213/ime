import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { catchError, finalize, forkJoin, of } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StudentService } from '../../student.service';

interface StudentSubject {
  id: string;
  name: string;
  code: string | null;

  teacherName: string;
  teacherAvatar: string | null;

  lessonsCount: number;
  homeworksCount: number;
  completedHomeworksCount: number;

  nextLesson: any | null;
}

@Component({
  selector: 'app-student-subjects',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './student-subjects.html',
  styleUrl: './student-subjects.scss',
})
export class StudentSubjects {
  private readonly service = inject(StudentService);

  readonly lessons = signal<any[]>([]);
  readonly homeworks = signal<any[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly search = signal('');

  readonly subjects = computed<StudentSubject[]>(() => {
    const subjectsMap = new Map<string, StudentSubject>();

    for (const lesson of this.lessons()) {
      const subject = lesson.subject;

      if (!subject?.id) {
        continue;
      }

      const existing = subjectsMap.get(subject.id);

      if (existing) {
        existing.lessonsCount++;

        if (
          new Date(lesson.date).getTime() > Date.now() &&
          (!existing.nextLesson ||
            new Date(lesson.date).getTime() < new Date(existing.nextLesson.date).getTime())
        ) {
          existing.nextLesson = lesson;
        }

        continue;
      }

      const nextLesson = new Date(lesson.date).getTime() > Date.now() ? lesson : null;

      subjectsMap.set(subject.id, {
        id: subject.id,
        name: subject.name,
        code: subject.code ?? null,

        teacherName: lesson.teacher?.user?.fullName ?? 'Преподаватель не указан',

        teacherAvatar: lesson.teacher?.user?.avatarUrl ?? null,

        lessonsCount: 1,
        homeworksCount: 0,
        completedHomeworksCount: 0,

        nextLesson,
      });
    }

    for (const homework of this.homeworks()) {
      const subjectId = homework.subject?.id;

      if (!subjectId) {
        continue;
      }

      const subject = subjectsMap.get(subjectId);

      if (!subject) {
        subjectsMap.set(subjectId, {
          id: subjectId,
          name: homework.subject.name,
          code: homework.subject.code ?? null,

          teacherName: homework.teacher?.user?.fullName ?? 'Преподаватель не указан',

          teacherAvatar: homework.teacher?.user?.avatarUrl ?? null,

          lessonsCount: 0,
          homeworksCount: 1,

          completedHomeworksCount: homework.submissions?.[0]?.status === 'GRADED' ? 1 : 0,

          nextLesson: null,
        });

        continue;
      }

      subject.homeworksCount++;

      if (homework.submissions?.[0]?.status === 'GRADED') {
        subject.completedHomeworksCount++;
      }
    }

    return Array.from(subjectsMap.values()).sort((first, second) =>
      first.name.localeCompare(second.name, 'ru'),
    );
  });

  readonly filteredSubjects = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('ru');

    if (!query) {
      return this.subjects();
    }

    return this.subjects().filter((subject) => {
      return (
        subject.name.toLocaleLowerCase('ru').includes(query) ||
        subject.teacherName.toLocaleLowerCase('ru').includes(query) ||
        subject.code?.toLocaleLowerCase('ru').includes(query)
      );
    });
  });

  constructor() {
    this.loadSubjects();
  }

  setSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.search.set(value);
  }

  homeworkProgress(subject: StudentSubject): number {
    if (!subject.homeworksCount) {
      return 0;
    }

    return Math.round((subject.completedHomeworksCount / subject.homeworksCount) * 100);
  }

  subjectIcon(index: number): string {
    const icons = [
      'database',
      'calculate',
      'language',
      'monitoring',
      'account_balance',
      'psychology',
      'code',
      'public',
    ];

    return icons[index % icons.length];
  }

  subjectClass(index: number): string {
    const classes = ['blue', 'purple', 'green', 'orange', 'cyan', 'red'];

    return classes[index % classes.length];
  }

  private loadSubjects(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      lessons: this.service.getSchedule().pipe(catchError(() => of([]))),

      homeworks: this.service.getHomeworks().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.lessons.set(result.lessons);
          this.homeworks.set(result.homeworks);
        },

        error: (error) => {
          console.error(error);

          this.error.set('Не удалось загрузить дисциплины');
        },
      });
  }
}
