import { Component, computed, inject, signal } from '@angular/core';

import { catchError, finalize, forkJoin, of } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TeacherService } from '../../services/teacher.service';
import { RouterLink } from '@angular/router';

interface StudentSubject {
  id: string;
  name: string;
}

interface TeacherStudent {
  id: string;

  fullName: string;
  email: string | null;
  avatarUrl: string | null;

  group: {
    id: string;
    name: string;
  };

  subjects: StudentSubject[];

  submissionsCount: number;
  pendingCount: number;
  gradedCount: number;

  totalScore: number;
  totalMaxScore: number;

  averagePercent: number;
}

@Component({
  selector: 'app-teacher-students',
  standalone: true,

  imports: [MatIconModule, MatProgressSpinnerModule, RouterLink],

  templateUrl: './teacher-students.html',
  styleUrl: './teacher-students.scss',
})
export class TeacherStudents {
  private readonly teacherService = inject(TeacherService);

  readonly lessons = signal<any[]>([]);
  readonly homeworks = signal<any[]>([]);

  readonly loading = signal(true);

  readonly error = signal<string | null>(null);

  readonly search = signal('');

  readonly selectedGroup = signal<string>('ALL');

  readonly students = computed<TeacherStudent[]>(() => {
    const map = new Map<string, TeacherStudent>();

    /*
     * Сначала собираем ВСЕХ студентов
     * из групп преподавателя.
     */
    for (const lesson of this.lessons()) {
      const group = lesson.group;

      if (!group?.id) {
        continue;
      }

      for (const student of group.students ?? []) {
        let item = map.get(student.id);

        if (!item) {
          item = {
            id: student.id,

            fullName: student.user?.fullName ?? 'Обучающийся',

            email: student.user?.email ?? null,

            avatarUrl: student.user?.avatarUrl ?? null,

            group: {
              id: group.id,
              name: group.name,
            },

            subjects: [],

            submissionsCount: 0,
            pendingCount: 0,
            gradedCount: 0,

            totalScore: 0,
            totalMaxScore: 0,

            averagePercent: 0,
          };

          map.set(student.id, item);
        }

        const subject = lesson.subject;

        if (subject?.id && !item.subjects.some((existing) => existing.id === subject.id)) {
          item.subjects.push({
            id: subject.id,
            name: subject.name,
          });
        }
      }
    }

    /*
     * Добавляем статистику
     * по домашним работам.
     */
    for (const homework of this.homeworks()) {
      const maxScore = Number(homework.maxScore) || 100;

      for (const submission of homework.submissions ?? []) {
        const item = map.get(submission.studentId);

        if (!item) {
          continue;
        }

        item.submissionsCount++;

        if (submission.status === 'SUBMITTED') {
          item.pendingCount++;
        }

        if (submission.status === 'GRADED' && typeof submission.score === 'number') {
          item.gradedCount++;

          item.totalScore += submission.score;

          item.totalMaxScore += maxScore;
        }
      }
    }

    /*
     * Средний результат.
     */
    for (const student of map.values()) {
      student.averagePercent =
        student.totalMaxScore > 0
          ? Math.round((student.totalScore / student.totalMaxScore) * 100)
          : 0;

      student.subjects.sort((first, second) => first.name.localeCompare(second.name, 'ru'));
    }

    return Array.from(map.values()).sort((first, second) =>
      first.fullName.localeCompare(second.fullName, 'ru'),
    );
  });

  readonly groups = computed(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
      }
    >();

    for (const student of this.students()) {
      map.set(student.group.id, student.group);
    }

    return Array.from(map.values()).sort((first, second) =>
      first.name.localeCompare(second.name, 'ru'),
    );
  });

  readonly filteredStudents = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('ru');

    const group = this.selectedGroup();

    return this.students().filter((student) => {
      const matchesGroup = group === 'ALL' || student.group.id === group;

      if (!matchesGroup) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        student.fullName.toLocaleLowerCase('ru').includes(query) ||
        student.email?.toLocaleLowerCase('ru').includes(query) ||
        student.group.name.toLocaleLowerCase('ru').includes(query) ||
        student.subjects.some((subject) => subject.name.toLocaleLowerCase('ru').includes(query))
      );
    });
  });

  readonly totalPending = computed(() => {
    return this.students().reduce((total, student) => total + student.pendingCount, 0);
  });

  readonly totalGraded = computed(() => {
    return this.students().reduce((total, student) => total + student.gradedCount, 0);
  });

  readonly averagePerformance = computed(() => {
    const withGrades = this.students().filter((student) => student.totalMaxScore > 0);

    if (!withGrades.length) {
      return 0;
    }

    return Math.round(
      withGrades.reduce((total, student) => total + student.averagePercent, 0) / withGrades.length,
    );
  });

  constructor() {
    this.loadStudents();
  }

  setSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.search.set(input.value);
  }

  setGroup(groupId: string): void {
    this.selectedGroup.set(groupId);
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

  private loadStudents(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      lessons: this.teacherService.getLessons().pipe(catchError(() => of([]))),

      homeworks: this.teacherService.getHomeworks().pipe(catchError(() => of([]))),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.lessons.set(response.lessons ?? []);

          this.homeworks.set(response.homeworks ?? []);
        },

        error: (error) => {
          console.error(error);

          this.error.set('Не удалось загрузить студентов');
        },
      });
  }
}
