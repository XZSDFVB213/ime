import { Component, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StudentService } from '../../student.service';

type HomeworkTab = 'CURRENT' | 'REVIEW' | 'COMPLETED';

@Component({
  selector: 'app-student-homeworks',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './student-homework.html',
  styleUrl: './student-homework.scss',
})
export class StudentHomeworks {
  private readonly service = inject(StudentService);

  readonly homeworks = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<HomeworkTab>('CURRENT');

  readonly currentHomeworks = computed(() =>
    this.homeworks().filter((homework) => {
      const submission = homework.submissions?.[0];

      return !submission;
    }),
  );

  readonly reviewHomeworks = computed(() =>
    this.homeworks().filter((homework) => {
      const submission = homework.submissions?.[0];

      return submission?.status === 'SUBMITTED';
    }),
  );

  readonly completedHomeworks = computed(() =>
    this.homeworks().filter((homework) => {
      const submission = homework.submissions?.[0];

      return submission?.status === 'GRADED';
    }),
  );

  readonly visibleHomeworks = computed(() => {
    switch (this.activeTab()) {
      case 'REVIEW':
        return this.reviewHomeworks();

      case 'COMPLETED':
        return this.completedHomeworks();

      default:
        return this.currentHomeworks();
    }
  });

  constructor() {
    this.loadHomeworks();
  }

  setTab(tab: HomeworkTab): void {
    this.activeTab.set(tab);
  }

  submission(homework: any): any | null {
    return homework.submissions?.[0] ?? null;
  }

  private loadHomeworks(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getHomeworks().subscribe({
      next: (response) => {
        this.homeworks.set(response ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error(error);

        this.error.set('Не удалось загрузить задания');
        this.loading.set(false);
      },
    });
  }
}
