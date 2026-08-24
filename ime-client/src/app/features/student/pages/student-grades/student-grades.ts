import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StudentService } from '../../student.service';

type GradeFilter = 'ALL' | 'EXCELLENT' | 'GOOD' | 'LOW';

interface GradeView {
  id: string;

  homeworkId: string;
  homeworkTitle: string;

  subjectId: string;
  subjectName: string;

  teacherName: string;

  score: number;
  maxScore: number;
  percent: number;

  feedback: string | null;
  gradedAt: string | null;
}

interface SubjectGradeSummary {
  id: string;
  name: string;

  gradesCount: number;
  averagePercent: number;
  averageScore: number;
}

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './student-grades.html',
  styleUrl: './student-grades.scss',
})
export class StudentGrades {
  private readonly service = inject(StudentService);

  readonly rawGrades = signal<any[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly activeFilter = signal<GradeFilter>('ALL');

  readonly grades = computed<GradeView[]>(() => {
    return this.rawGrades()
      .map((grade): GradeView | null => {
        const homework = grade.homework;
        const score = Number(grade.score);

        if (!homework || !Number.isFinite(score)) {
          return null;
        }

        const maxScore = Number(homework.maxScore) || 100;

        const percent = Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)));

        return {
          id: grade.id,

          homeworkId: homework.id,
          homeworkTitle: homework.title,

          subjectId: homework.subject?.id ?? 'unknown',

          subjectName: homework.subject?.name ?? 'Дисциплина не указана',

          teacherName: homework.teacher?.user?.fullName ?? 'Преподаватель не указан',

          score,
          maxScore,
          percent,

          feedback: grade.feedback ?? null,
          gradedAt: grade.gradedAt ?? null,
        };
      })
      .filter((grade): grade is GradeView => grade !== null)
      .sort((first, second) => {
        return new Date(second.gradedAt ?? 0).getTime() - new Date(first.gradedAt ?? 0).getTime();
      });
  });

  readonly filteredGrades = computed(() => {
    const filter = this.activeFilter();

    switch (filter) {
      case 'EXCELLENT':
        return this.grades().filter((grade) => grade.percent >= 85);

      case 'GOOD':
        return this.grades().filter((grade) => grade.percent >= 60 && grade.percent < 85);

      case 'LOW':
        return this.grades().filter((grade) => grade.percent < 60);

      default:
        return this.grades();
    }
  });

  readonly subjectSummaries = computed<SubjectGradeSummary[]>(() => {
    const subjects = new Map<
      string,
      {
        id: string;
        name: string;
        percentages: number[];
        scores: number[];
      }
    >();

    for (const grade of this.grades()) {
      const existing = subjects.get(grade.subjectId);

      if (existing) {
        existing.percentages.push(grade.percent);

        existing.scores.push(grade.score);

        continue;
      }

      subjects.set(grade.subjectId, {
        id: grade.subjectId,
        name: grade.subjectName,
        percentages: [grade.percent],
        scores: [grade.score],
      });
    }

    return Array.from(subjects.values())
      .map((subject) => ({
        id: subject.id,
        name: subject.name,

        gradesCount: subject.percentages.length,

        averagePercent: Math.round(
          subject.percentages.reduce((sum, value) => sum + value, 0) / subject.percentages.length,
        ),

        averageScore: Math.round(
          subject.scores.reduce((sum, value) => sum + value, 0) / subject.scores.length,
        ),
      }))
      .sort((first, second) => second.averagePercent - first.averagePercent);
  });

  readonly averagePercent = computed(() => {
    if (!this.grades().length) {
      return 0;
    }

    return Math.round(
      this.grades().reduce((sum, grade) => sum + grade.percent, 0) / this.grades().length,
    );
  });

  readonly highestPercent = computed(() => {
    if (!this.grades().length) {
      return 0;
    }

    return Math.max(...this.grades().map((grade) => grade.percent));
  });

  readonly excellentCount = computed(() => {
    return this.grades().filter((grade) => grade.percent >= 85).length;
  });

  readonly successfulCount = computed(() => {
    return this.grades().filter((grade) => grade.percent >= 60).length;
  });

  constructor() {
    this.loadGrades();
  }

  setFilter(filter: GradeFilter): void {
    this.activeFilter.set(filter);
  }

  gradeLabel(percent: number): string {
    if (percent >= 85) {
      return 'Отлично';
    }

    if (percent >= 70) {
      return 'Хорошо';
    }

    if (percent >= 60) {
      return 'Зачтено';
    }

    return 'Низкий результат';
  }

  gradeClass(percent: number): string {
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

  private loadGrades(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getGrades().subscribe({
      next: (response) => {
        this.rawGrades.set(response ?? []);
        this.loading.set(false);
      },

      error: (error) => {
        console.error(error);

        this.error.set(error.error?.message ?? 'Не удалось загрузить оценки');

        this.loading.set(false);
      },
    });
  }
}
