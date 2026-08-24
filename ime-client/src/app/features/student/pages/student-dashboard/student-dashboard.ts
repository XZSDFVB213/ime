import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';

import { catchError, finalize, forkJoin, of } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { StudentService } from '../../student.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    MatIconModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss',
})
export class StudentDashboard {
  private readonly service = inject(StudentService);

  readonly student = signal<any | null>(null);
  readonly lessons = signal<any[]>([]);
  readonly homeworks = signal<any[]>([]);
  readonly grades = signal<any[]>([]);

  readonly loading = signal(true);
  readonly selectedDate = signal<Date | null>(new Date());

  readonly announcements = signal([
    {
      title: 'Изменение в расписании',
      text: 'Следующая пара по дисциплине «Базы данных» перенесена в аудиторию 301.',
      date: 'Сегодня, 09:15',
      important: true,
    },
    {
      title: 'Новая методичка в библиотеке',
      text: 'Добавлены материалы для подготовки к экзамену.',
      date: 'Вчера, 16:40',
      important: false,
    },
    {
      title: 'Опрос обучающихся',
      text: 'Просим пройти опрос по качеству образовательного процесса.',
      date: '28 мая, 11:20',
      important: false,
    },
  ]);

  readonly quickLinks = signal([
    {
      icon: 'calendar_month',
      label: 'Учебный план',
      className: 'blue',
    },
    {
      icon: 'menu_book',
      label: 'Электронная библиотека',
      className: 'purple',
    },
    {
      icon: 'school',
      label: 'Онлайн-курсы',
      className: 'green',
    },
    {
      icon: 'work_outline',
      label: 'Портфолио',
      className: 'orange',
    },
  ]);

  readonly firstName = computed(() => {
    const fullName = this.student()?.fullName;

    return fullName ? fullName.trim().split(' ')[0] : 'обучающийся';
  });

  readonly upcomingLessons = computed(() => {
    const now = Date.now();

    const futureLessons = [...this.lessons()]
      .filter((lesson) => {
        return new Date(lesson.date).getTime() >= now;
      })
      .sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

    return (futureLessons.length ? futureLessons : this.lessons()).slice(0, 3);
  });

  readonly currentHomeworks = computed(() => {
    return this.homeworks()
      .filter((homework) => {
        const submission = homework.submissions?.[0];

        return submission?.status !== 'GRADED';
      })
      .slice(0, 4);
  });

  readonly completedHomeworks = computed(() => {
    return this.homeworks().filter((homework) => {
      return homework.submissions?.[0]?.status === 'GRADED';
    }).length;
  });

  readonly progress = computed(() => {
    const total = this.homeworks().length;

    if (!total) {
      return 0;
    }

    return Math.round((this.completedHomeworks() / total) * 100);
  });

  readonly subjectsCount = computed(() => {
    const subjectIds = new Set(
      this.lessons()
        .map((lesson) => lesson.subject?.id)
        .filter(Boolean),
    );

    return subjectIds.size;
  });

  readonly averageScore = computed(() => {
    const scores = this.grades()
      .map((grade) => grade.score)
      .filter((score) => typeof score === 'number');

    if (!scores.length) {
      return 0;
    }

    const total = scores.reduce((sum, score) => sum + score, 0);

    return Math.round(total / scores.length);
  });

  constructor() {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);

    forkJoin({
      student: this.service.getMe().pipe(catchError(() => of(null))),

      lessons: this.service.getSchedule().pipe(catchError(() => of([]))),

      homeworks: this.service.getHomeworks().pipe(catchError(() => of([]))),

      grades: this.service.getGrades().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((result) => {
        this.student.set(result.student);
        this.lessons.set(result.lessons);
        this.homeworks.set(result.homeworks);
        this.grades.set(result.grades);
      });
  }

  lessonEndTime(lesson: any): Date {
    const start = new Date(lesson.date);

    return new Date(start.getTime() + lesson.duration * 60_000);
  }

  submission(homework: any): any | null {
    return homework.submissions?.[0] ?? null;
  }

  deadlineClass(homework: any): string {
    const deadline = new Date(homework.deadline).getTime();
    const diff = deadline - Date.now();

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 2) {
      return 'danger';
    }

    if (days <= 7) {
      return 'warning';
    }

    return 'success';
  }
}
