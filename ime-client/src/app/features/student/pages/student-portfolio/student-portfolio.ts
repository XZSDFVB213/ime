import { Component, computed, inject, signal } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatIconModule } from '@angular/material/icon';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { catchError, finalize, forkJoin, of } from 'rxjs';

import { environment } from '../../../../environments/environment';

import {
  PortfolioItem,
  PortfolioItemType,
  PortfolioService,
  PortfolioSubject,
} from '../../portfolio.service';

import { AddPortfolioDialog } from './add-portfolio-dialog/add-portfolio-dialog';
import { StudentService } from '../../student.service';

type PortfolioFilter = 'ALL' | 'WORKS' | 'ACHIEVEMENTS' | PortfolioItemType;

@Component({
  selector: 'app-student-portfolio',

  standalone: true,

  imports: [MatIconModule, MatDialogModule, MatSnackBarModule],

  templateUrl: './student-portfolio.html',

  styleUrl: './student-portfolio.scss',
})
export class StudentPortfolio {
  private readonly portfolioService = inject(PortfolioService);
  private readonly studentService = inject(StudentService);
  private readonly dialog = inject(MatDialog);

  private readonly snackBar = inject(MatSnackBar);

  readonly items = signal<PortfolioItem[]>([]);

  readonly subjects = signal<PortfolioSubject[]>([]);

  readonly loading = signal(true);

  readonly search = signal('');

  readonly filter = signal<PortfolioFilter>('ALL');

  readonly deletingId = signal<string | null>(null);

  readonly totalCount = computed(() => this.items().length);

  readonly projectsCount = computed(
    () => this.items().filter((item) => item.type === 'PROJECT').length,
  );

  readonly academicWorksCount = computed(
    () =>
      this.items().filter((item) => ['COURSEWORK', 'RESEARCH', 'PRESENTATION'].includes(item.type))
        .length,
  );

  readonly achievementsCount = computed(
    () => this.items().filter((item) => ['CERTIFICATE', 'DIPLOMA'].includes(item.type)).length,
  );

  readonly filteredItems = computed(() => {
    const search = this.search().trim().toLowerCase();

    const filter = this.filter();

    return this.items().filter((item) => {
      if (filter === 'ACHIEVEMENTS') {
        if (item.type !== 'CERTIFICATE' && item.type !== 'DIPLOMA') {
          return false;
        }
      } else if (filter === 'WORKS') {
        if (item.type === 'CERTIFICATE' || item.type === 'DIPLOMA') {
          return false;
        }
      } else if (filter !== 'ALL' && item.type !== filter) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        item.title.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.subject?.name?.toLowerCase().includes(search) ||
        item.fileName?.toLowerCase().includes(search)
      );
    });
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    forkJoin({
      portfolio: this.portfolioService.getPortfolio(),

      lessons: this.studentService.getSchedule().pipe(
        catchError((error) => {
          console.error('Ошибка загрузки расписания:', error);

          return of([]);
        }),
      ),

      homeworks: this.studentService.getHomeworks().pipe(
        catchError((error) => {
          console.error('Ошибка загрузки домашних заданий:', error);

          return of([]);
        }),
      ),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: ({ portfolio, lessons, homeworks }) => {
          this.items.set(portfolio);

          this.subjects.set(this.buildSubjects(lessons, homeworks));
        },

        error: (error) => {
          console.error('Ошибка загрузки портфолио:', error);

          this.snackBar.open('Не удалось загрузить портфолио', 'Закрыть', {
            duration: 3500,
          });
        },
      });
  }
  private buildSubjects(lessons: any[], homeworks: any[]): PortfolioSubject[] {
    const subjectsMap = new Map<string, PortfolioSubject>();

    /*
     * Дисциплины из расписания
     */
    for (const lesson of lessons) {
      const subject = lesson.subject;

      if (!subject?.id) {
        continue;
      }

      if (subjectsMap.has(subject.id)) {
        continue;
      }

      subjectsMap.set(subject.id, {
        id: subject.id,

        name: subject.name,

        code: subject.code ?? null,
      });
    }

    /*
     * Дисциплины из домашних заданий.
     *
     * Они тоже нужны, потому что
     * дисциплина может иметь homework,
     * но сейчас не иметь занятия
     * в расписании.
     */
    for (const homework of homeworks) {
      const subject = homework.subject;

      if (!subject?.id) {
        continue;
      }

      if (subjectsMap.has(subject.id)) {
        continue;
      }

      subjectsMap.set(subject.id, {
        id: subject.id,

        name: subject.name,

        code: subject.code ?? null,
      });
    }

    return Array.from(subjectsMap.values()).sort((first, second) =>
      first.name.localeCompare(second.name, 'ru'),
    );
  }
  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddPortfolioDialog, {
      width: '620px',

      maxWidth: 'calc(100vw - 32px)',

      maxHeight: '92vh',

      autoFocus: false,

      data: {
        subjects: this.subjects(),
      },
    });

    dialogRef.afterClosed().subscribe((created: PortfolioItem | undefined) => {
      if (!created) {
        return;
      }

      this.items.update((items) => [created, ...items]);

      this.snackBar.open('Работа добавлена в портфолио', 'OK', {
        duration: 2500,
      });
    });
  }

  deleteItem(item: PortfolioItem): void {
    const confirmed = confirm(`Удалить «${item.title}» из портфолио?`);

    if (!confirmed) {
      return;
    }

    this.deletingId.set(item.id);

    this.portfolioService
      .deleteItem(item.id)
      .pipe(
        finalize(() => {
          this.deletingId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.items.update((items) => items.filter((current) => current.id !== item.id));

          this.snackBar.open('Работа удалена', 'OK', {
            duration: 2500,
          });
        },

        error: (error) => {
          console.error('Ошибка удаления:', error);

          this.snackBar.open(error.error?.message ?? 'Не удалось удалить работу', 'Закрыть', {
            duration: 3500,
          });
        },
      });
  }

  openItem(item: PortfolioItem): void {
    const url = this.portfolioService.resolveUrl(item.url);

    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setFilter(filter: PortfolioFilter): void {
    this.filter.set(filter);
  }

  typeLabel(type: PortfolioItemType): string {
    const labels: Record<PortfolioItemType, string> = {
      PROJECT: 'Проект',

      COURSEWORK: 'Курсовая',

      RESEARCH: 'Исследование',

      PRESENTATION: 'Презентация',

      CERTIFICATE: 'Сертификат',

      DIPLOMA: 'Диплом / грамота',

      OTHER: 'Другое',
    };

    return labels[type];
  }

  typeIcon(type: PortfolioItemType): string {
    const icons: Record<PortfolioItemType, string> = {
      PROJECT: 'code',

      COURSEWORK: 'description',

      RESEARCH: 'science',

      PRESENTATION: 'slideshow',

      CERTIFICATE: 'workspace_premium',

      DIPLOMA: 'military_tech',

      OTHER: 'folder_open',
    };

    return icons[type];
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }

  formatFileSize(size?: number | null): string {
    if (!size) {
      return '';
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(0)} КБ`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} МБ`;
  }
}
