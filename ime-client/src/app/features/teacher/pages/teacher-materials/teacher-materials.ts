import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { catchError, finalize, forkJoin, of } from 'rxjs';

import { DatePipe } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TeacherService } from '../../services/teacher.service';
import { environment } from '../../../../environments/environment';


type MaterialMode = 'FILE' | 'LINK';

type MaterialFilter = 'ALL' | 'FILE' | 'LINK';

@Component({
  selector: 'app-teacher-materials',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],

  templateUrl: './teacher-materials.html',
  styleUrl: './teacher-materials.scss',
})
export class TeacherMaterials {
  private readonly teacherService = inject(TeacherService);

  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;

  readonly materials = signal<any[]>([]);

  readonly lessons = signal<any[]>([]);

  readonly loading = signal(true);

  readonly saving = signal(false);

  readonly deletingId = signal<string | null>(null);

  readonly error = signal<string | null>(null);

  readonly mode = signal<MaterialMode>('FILE');

  readonly filter = signal<MaterialFilter>('ALL');

  readonly search = signal('');

  readonly selectedFile = signal<File | null>(null);

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),

    description: new FormControl('', {
      nonNullable: true,
    }),

    subjectId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    lessonId: new FormControl('', {
      nonNullable: true,
    }),

    url: new FormControl('', {
      nonNullable: true,
    }),
  });

  readonly subjects = computed(() => {
    const map = new Map<string, any>();

    for (const lesson of this.lessons()) {
      if (lesson.subject?.id) {
        map.set(lesson.subject.id, lesson.subject);
      }
    }

    return Array.from(map.values()).sort((first, second) =>
      first.name.localeCompare(second.name, 'ru'),
    );
  });

  readonly availableLessons = computed(() => {
    const subjectId = this.form.controls.subjectId.value;

    if (!subjectId) {
      return [];
    }

    return this.lessons()
      .filter((lesson) => lesson.subject?.id === subjectId || lesson.subjectId === subjectId)
      .sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime());
  });

  readonly filteredMaterials = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('ru');

    return this.materials()
      .filter((material) => {
        if (this.filter() !== 'ALL' && material.type !== this.filter()) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          material.title?.toLocaleLowerCase('ru').includes(query) ||
          material.description?.toLocaleLowerCase('ru').includes(query) ||
          material.subject?.name?.toLocaleLowerCase('ru').includes(query) ||
          material.lesson?.title?.toLocaleLowerCase('ru').includes(query) ||
          material.fileName?.toLocaleLowerCase('ru').includes(query)
        );
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      );
  });

  readonly fileCount = computed(() => {
    return this.materials().filter((material) => material.type === 'FILE').length;
  });

  readonly linkCount = computed(() => {
    return this.materials().filter((material) => material.type === 'LINK').length;
  });

  readonly totalSize = computed(() => {
    return this.materials()
      .filter((material) => material.type === 'FILE')
      .reduce((total, material) => total + Number(material.size ?? 0), 0);
  });

  constructor() {
    this.loadData();

    this.form.controls.subjectId.valueChanges.subscribe(() => {
      this.form.controls.lessonId.setValue('');
    });
  }

  setMode(mode: MaterialMode): void {
    this.mode.set(mode);

    this.selectedFile.set(null);

    this.form.controls.url.setValue('');

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  setFilter(filter: MaterialFilter): void {
    this.filter.set(filter);
  }

  setSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.search.set(input.value);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0] ?? null;

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      this.snackBar.open('Максимальный размер файла — 50 МБ', 'Закрыть', {
        duration: 3500,
      });

      input.value = '';

      this.selectedFile.set(null);

      return;
    }

    this.selectedFile.set(file);

    /*
     * Если название ещё пустое —
     * подставляем имя файла.
     */
    if (!this.form.controls.title.value.trim()) {
      const name = file.name.replace(/\.[^.]+$/, '');

      this.form.controls.title.setValue(name);
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, subjectId, lessonId, url } = this.form.getRawValue();

    if (this.mode() === 'FILE') {
      const file = this.selectedFile();

      if (!file) {
        this.snackBar.open('Выберите файл', 'Закрыть', {
          duration: 3000,
        });

        return;
      }

      const formData = new FormData();

      formData.append('title', title.trim());

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      formData.append('subjectId', subjectId);

      if (lessonId) {
        formData.append('lessonId', lessonId);
      }

      formData.append('file', file);

      this.uploadFile(formData);

      return;
    }

    if (!url.trim()) {
      this.snackBar.open('Укажите ссылку', 'Закрыть', {
        duration: 3000,
      });

      return;
    }

    this.createLink({
      title: title.trim(),

      description: description.trim() || undefined,

      subjectId,

      lessonId: lessonId || undefined,

      url: url.trim(),
    });
  }

  openMaterial(material: any): void {
    const url = this.materialUrl(material);

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  deleteMaterial(material: any): void {
    const confirmed = window.confirm(`Удалить материал «${material.title}»?`);

    if (!confirmed) {
      return;
    }

    this.deletingId.set(material.id);

    this.teacherService
      .deleteMaterial(material.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.materials.update((materials) => materials.filter((item) => item.id !== material.id));

          this.snackBar.open('Материал удалён', 'Закрыть', {
            duration: 2500,
          });
        },

        error: (error) => {
          console.error(error);

          this.snackBar.open(error.error?.message ?? 'Не удалось удалить материал', 'Закрыть', {
            duration: 3500,
          });
        },
      });
  }

  materialIcon(material: any): string {
    if (material.type === 'LINK') {
      return 'link';
    }

    const mime = material.mimeType ?? '';

    if (mime === 'application/pdf') {
      return 'picture_as_pdf';
    }

    if (mime.startsWith('image/')) {
      return 'image';
    }

    if (mime.includes('presentation') || mime.includes('powerpoint')) {
      return 'slideshow';
    }

    if (mime.includes('word')) {
      return 'description';
    }

    if (mime.includes('spreadsheet') || mime.includes('excel')) {
      return 'table_chart';
    }

    if (mime.includes('zip')) {
      return 'folder_zip';
    }

    return 'insert_drive_file';
  }

  materialTypeLabel(material: any): string {
    if (material.type === 'LINK') {
      return 'Ссылка';
    }

    if (material.mimeType === 'application/pdf') {
      return 'PDF';
    }

    if (material.mimeType?.startsWith('image/')) {
      return 'Изображение';
    }

    return 'Файл';
  }

  formatSize(bytes: number | null): string {
    if (!bytes) {
      return '—';
    }

    if (bytes < 1024) {
      return `${bytes} Б`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} КБ`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  }

  materialUrl(material: any): string {
    if (material.type === 'LINK') {
      return material.url;
    }

    if (material.url?.startsWith('http')) {
      return material.url;
    }

    const api = environment.api.replace(/\/$/, '');

    return `${api}${material.url}`;
  }

  private uploadFile(formData: FormData): void {
    this.saving.set(true);

    this.teacherService
      .uploadMaterial(formData)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (material) => {
          this.materials.update((materials) => [material, ...materials]);

          this.afterSave('Материал загружен');
        },

        error: (error) => {
          console.error(error);

          this.snackBar.open(error.error?.message ?? 'Не удалось загрузить файл', 'Закрыть', {
            duration: 4000,
          });
        },
      });
  }

  private createLink(dto: {
    title: string;
    description?: string;
    subjectId: string;
    lessonId?: string;
    url: string;
  }): void {
    this.saving.set(true);

    this.teacherService
      .createLinkMaterial(dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (material) => {
          this.materials.update((materials) => [material, ...materials]);

          this.afterSave('Ссылка добавлена');
        },

        error: (error) => {
          console.error(error);

          this.snackBar.open(error.error?.message ?? 'Не удалось добавить ссылку', 'Закрыть', {
            duration: 4000,
          });
        },
      });
  }

  private afterSave(message: string): void {
    this.snackBar.open(message, 'Закрыть', {
      duration: 2500,
    });

    this.form.reset({
      title: '',
      description: '',
      subjectId: '',
      lessonId: '',
      url: '',
    });

    this.selectedFile.set(null);

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      materials: this.teacherService.getMaterials().pipe(catchError(() => of([]))),

      lessons: this.teacherService.getLessons().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ materials, lessons }) => {
          this.materials.set(materials ?? []);

          this.lessons.set(lessons ?? []);
        },

        error: (error) => {
          console.error(error);

          this.error.set('Не удалось загрузить материалы');
        },
      });
  }
}
