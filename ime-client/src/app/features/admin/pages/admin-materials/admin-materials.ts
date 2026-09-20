import { Component, computed, inject, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MatSelectModule } from '@angular/material/select';

import { forkJoin } from 'rxjs';

import { AdminService } from '../../services/admin.service';

import { CreateMaterialDialogComponent } from './create-material-dialog/create-material-dialog';

interface Subject {
  id: string;
  name: string;
}

interface Material {
  id: string;

  title: string;

  description?: string | null;

  type: 'FILE' | 'LINK';

  url: string;

  fileName?: string | null;

  mimeType?: string | null;

  size?: number | null;

  createdAt: string;

  /*
   * Теперь материал может быть
   * общим и не иметь дисциплины.
   */
  subject: Subject | null;

  teacher?: {
    user: {
      fullName: string;
    };
  } | null;

  uploadedByUser?: {
    id: string;
    fullName: string;
  } | null;
}

type MaterialTypeFilter = 'ALL' | 'FILE' | 'LINK';

type MaterialSubjectFilter = 'ALL' | 'GENERAL' | string;

@Component({
  selector: 'app-admin-materials',

  standalone: true,

  imports: [MatIconModule, MatDialogModule, MatSnackBarModule, MatSelectModule],

  templateUrl: './admin-materials.html',

  styleUrl: './admin-materials.scss',
})
export class AdminMaterials {
  private readonly adminService = inject(AdminService);

  private readonly dialog = inject(MatDialog);

  private readonly snackBar = inject(MatSnackBar);

  readonly materials = signal<Material[]>([]);

  readonly subjects = signal<Subject[]>([]);

  readonly loading = signal(true);

  readonly search = signal('');

  readonly typeFilter = signal<MaterialTypeFilter>('ALL');

  readonly subjectFilter = signal<MaterialSubjectFilter>('ALL');

  readonly filteredMaterials = computed(() => {
    const search = this.search().trim().toLocaleLowerCase('ru');

    const type = this.typeFilter();

    const subject = this.subjectFilter();

    return this.materials()
      .filter((material) => {
        /*
         * Тип материала.
         */
        if (type !== 'ALL' && material.type !== type) {
          return false;
        }

        /*
         * Только общие материалы.
         */
        if (subject === 'GENERAL' && material.subject !== null) {
          return false;
        }

        /*
         * Конкретная дисциплина.
         */
        if (subject !== 'ALL' && subject !== 'GENERAL' && material.subject?.id !== subject) {
          return false;
        }

        /*
         * Без поиска дальше
         * проверять нечего.
         */
        if (!search) {
          return true;
        }

        const title = material.title?.toLocaleLowerCase('ru') ?? '';

        const description = material.description?.toLocaleLowerCase('ru') ?? '';

        const subjectName = material.subject?.name?.toLocaleLowerCase('ru') ?? '';

        const fileName = material.fileName?.toLocaleLowerCase('ru') ?? '';

        return (
          title.includes(search) ||
          description.includes(search) ||
          subjectName.includes(search) ||
          fileName.includes(search)
        );
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      );
  });

  readonly filesCount = computed(
    () => this.materials().filter((item) => item.type === 'FILE').length,
  );

  readonly linksCount = computed(
    () => this.materials().filter((item) => item.type === 'LINK').length,
  );

  readonly generalCount = computed(() => this.materials().filter((item) => !item.subject).length);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    forkJoin({
      subjects: this.adminService.getMaterialSubjects(),

      materials: this.adminService.getMaterials(),
    }).subscribe({
      next: ({ subjects, materials }) => {
        this.subjects.set(subjects ?? []);

        this.materials.set((materials ?? []) as Material[]);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Ошибка загрузки материалов', error);

        this.loading.set(false);

        this.snackBar.open('Не удалось загрузить материалы', 'Закрыть', {
          duration: 3000,
        });
      },
    });
  }

  setSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.search.set(input.value);
  }

  setTypeFilter(type: MaterialTypeFilter): void {
    this.typeFilter.set(type);
  }

  setSubjectFilter(subjectId: string): void {
    this.subjectFilter.set(subjectId);
  }

  openCreate(): void {
    const ref = this.dialog.open(CreateMaterialDialogComponent, {
      width: '600px',

      maxWidth: 'calc(100vw - 32px)',

      autoFocus: false,

      data: {
        subjects: this.subjects(),
      },
    });

    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.load();
      }
    });
  }

  deleteMaterial(material: Material): void {
    const confirmed = confirm(`Удалить материал «${material.title}»?`);

    if (!confirmed) {
      return;
    }

    this.adminService.deleteMaterial(material.id).subscribe({
      next: () => {
        this.materials.update((items) => items.filter((item) => item.id !== material.id));

        this.snackBar.open('Материал удалён', 'Закрыть', {
          duration: 2500,
        });
      },

      error: (error) => {
        console.error('Ошибка удаления материала', error);

        this.snackBar.open(error.error?.message ?? 'Не удалось удалить материал', 'Закрыть', {
          duration: 3000,
        });
      },
    });
  }

  subjectName(material: Material): string {
    return material.subject?.name ?? 'Общий материал';
  }

  formatSize(size?: number | null): string {
    if (!size) {
      return '';
    }

    if (size < 1024) {
      return `${size} Б`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} КБ`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} МБ`;
  }
}
