import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  DatePipe,
} from '@angular/common';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';

import {
  StudentService,
} from '../../student.service';

import {
  environment,
} from '../../../../environments/environment';

type MaterialFilter =
  | 'ALL'
  | 'FILE'
  | 'LINK';

@Component({
  selector: 'app-student-materials',

  standalone: true,

  imports: [
    DatePipe,
    MatIconModule,
    MatProgressSpinnerModule,
  ],

  templateUrl: './student-materials.html',
  styleUrl: './student-materials.scss',
})
export class StudentMaterials {
  private readonly studentService =
    inject(StudentService);

  readonly materials =
    signal<any[]>([]);

  readonly loading =
    signal(true);

  readonly error =
    signal<string | null>(null);

  readonly search =
    signal('');

  readonly filter =
    signal<MaterialFilter>('ALL');

  readonly selectedSubject =
    signal<string>('ALL');

  readonly subjects = computed(() => {
    const map =
      new Map<
        string,
        {
          id: string;
          name: string;
          code: string | null;
        }
      >();

    for (
      const material of
      this.materials()
    ) {
      const subject =
        material.subject;

      if (!subject?.id) {
        continue;
      }

      map.set(
        subject.id,
        {
          id: subject.id,

          name:
            subject.name,

          code:
            subject.code ??
            null,
        },
      );
    }

    return Array.from(
      map.values(),
    ).sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          'ru',
        ),
    );
  });

  readonly filteredMaterials =
    computed(() => {
      const query =
        this.search()
          .trim()
          .toLocaleLowerCase('ru');

      return this.materials()
        .filter(
          (material) => {
            if (
              this.filter() !==
                'ALL' &&
              material.type !==
                this.filter()
            ) {
              return false;
            }

            if (
              this.selectedSubject() !==
                'ALL' &&
              material.subjectId !==
                this.selectedSubject()
            ) {
              return false;
            }

            if (!query) {
              return true;
            }

            return (
              material.title
                ?.toLocaleLowerCase(
                  'ru',
                )
                .includes(query) ||

              material.description
                ?.toLocaleLowerCase(
                  'ru',
                )
                .includes(query) ||

              material.subject?.name
                ?.toLocaleLowerCase(
                  'ru',
                )
                .includes(query) ||

              material.lesson?.title
                ?.toLocaleLowerCase(
                  'ru',
                )
                .includes(query) ||

              material.teacher?.user
                ?.fullName
                ?.toLocaleLowerCase(
                  'ru',
                )
                .includes(query) ||

              material.fileName
                ?.toLocaleLowerCase(
                  'ru',
                )
                .includes(query)
            );
          },
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime(),
        );
    });

  readonly fileCount =
    computed(() => {
      return this.materials()
        .filter(
          (material) =>
            material.type ===
            'FILE',
        )
        .length;
    });

  readonly linkCount =
    computed(() => {
      return this.materials()
        .filter(
          (material) =>
            material.type ===
            'LINK',
        )
        .length;
    });

  readonly recentCount =
    computed(() => {
      const week =
        7 *
        24 *
        60 *
        60 *
        1000;

      const now =
        Date.now();

      return this.materials()
        .filter(
          (material) =>
            now -
              new Date(
                material.createdAt,
              ).getTime() <=
            week,
        )
        .length;
    });

  constructor() {
    this.loadMaterials();
  }

  setSearch(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.search.set(
      input.value,
    );
  }

  setFilter(
    filter: MaterialFilter,
  ): void {
    this.filter.set(
      filter,
    );
  }

  setSubject(
    subjectId: string,
  ): void {
    this.selectedSubject.set(
      subjectId,
    );
  }

  subjectMaterialCount(
    subjectId: string,
  ): number {
    return this.materials()
      .filter(
        (material) =>
          material.subjectId ===
          subjectId,
      )
      .length;
  }

  openMaterial(
    material: any,
  ): void {
    window.open(
      this.materialUrl(material),
      '_blank',
      'noopener,noreferrer',
    );
  }

  materialUrl(
    material: any,
  ): string {
    if (
      material.type ===
      'LINK'
    ) {
      return material.url;
    }

    if (
      material.url?.startsWith(
        'http',
      )
    ) {
      return material.url;
    }

    const api =
      environment.api.replace(
        /\/$/,
        '',
      );

    return `${api}${material.url}`;
  }

  materialIcon(
    material: any,
  ): string {
    if (
      material.type ===
      'LINK'
    ) {
      return 'link';
    }

    const mime =
      material.mimeType ?? '';

    if (
      mime ===
      'application/pdf'
    ) {
      return 'picture_as_pdf';
    }

    if (
      mime.startsWith(
        'image/',
      )
    ) {
      return 'image';
    }

    if (
      mime.includes(
        'presentation',
      ) ||
      mime.includes(
        'powerpoint',
      )
    ) {
      return 'slideshow';
    }

    if (
      mime.includes(
        'word',
      )
    ) {
      return 'description';
    }

    if (
      mime.includes(
        'spreadsheet',
      ) ||
      mime.includes(
        'excel',
      )
    ) {
      return 'table_chart';
    }

    if (
      mime.includes(
        'zip',
      )
    ) {
      return 'folder_zip';
    }

    return 'insert_drive_file';
  }

  materialLabel(
    material: any,
  ): string {
    if (
      material.type ===
      'LINK'
    ) {
      return 'Ссылка';
    }

    if (
      material.mimeType ===
      'application/pdf'
    ) {
      return 'PDF';
    }

    if (
      material.mimeType
        ?.startsWith(
          'image/',
        )
    ) {
      return 'Изображение';
    }

    if (
      material.mimeType
        ?.includes(
          'presentation',
        ) ||
      material.mimeType
        ?.includes(
          'powerpoint',
        )
    ) {
      return 'Презентация';
    }

    if (
      material.mimeType
        ?.includes(
          'word',
        )
    ) {
      return 'Документ';
    }

    return 'Файл';
  }

  formatSize(
    bytes:
      | number
      | null
      | undefined,
  ): string {
    if (!bytes) {
      return '';
    }

    if (
      bytes < 1024
    ) {
      return `${bytes} Б`;
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${(
        bytes / 1024
      ).toFixed(1)} КБ`;
    }

    return `${(
      bytes /
      1024 /
      1024
    ).toFixed(1)} МБ`;
  }

  private loadMaterials(): void {
    this.loading.set(true);
    this.error.set(null);

    this.studentService
      .getMaterials()
      .subscribe({
        next: (materials) => {
          this.materials.set(
            materials ?? [],
          );

          this.loading.set(false);
        },

        error: (error) => {
          console.error(
            'Ошибка загрузки материалов:',
            error,
          );

          this.error.set(
            error.error?.message ??
              'Не удалось загрузить материалы',
          );

          this.loading.set(false);
        },
      });
  }
}